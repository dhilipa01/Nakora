'use strict';
const { app, nativeTheme } = require('electron');
const { registerProtocol, handleProtocol } = require('./protocol.js');
const { createMainWindow, setStore }        = require('./window.js');
const { createTray, updateThreatLevel }     = require('./tray.js');
const { registerAll }                       = require('./ipc/router.js');
const database   = require('./storage/database.js');
const storeInit  = require('./storage/store.js');
const auditLog   = require('./services/audit-log.service.js');
const dnsSim     = require('./services/dns-simulator.service.js');
const etwMon     = require('./services/etw-monitor.service.js');
const filterLists= require('./services/filter-lists.service.js');
const domainsH   = require('./ipc/handlers/domains.handler.js');
const combinedH  = require('./ipc/handlers/combined.handler.js');

// ─── Single-instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

let mainWindow = null;
app.on('second-instance', () => {
  if (mainWindow) { if (mainWindow.isMinimized()) mainWindow.restore(); mainWindow.focus(); }
});

// ─── Protocol registration (must be before app ready) ─────────────────────────
registerProtocol();

// ─── App ready ────────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  nativeTheme.themeSource = 'dark';

  // 1. Storage
  const store = storeInit.init(app);
  const db    = database.init(app);
  setStore(store);

  // 2. Audit log
  auditLog.init(db);
  auditLog.log({ action: 'app:start', channel: 'system', success: true });

  // 3. Filter lists (loads once)
  filterLists.load();

  // 4. Wire handlers
  domainsH.init(db);
  combinedH.initSettings(store);
  combinedH.initSystem(app);
  combinedH.initExport(db, store);

  // 5. Register IPC
  registerAll();

  // 6. Register app:// protocol handler
  handleProtocol();

  // 7. Start services
  dnsSim.init(db);
  dnsSim.start();
  etwMon.start();
  etwMon.attachDnsSimulator(dnsSim);

  // 8. Tray icon threat level sync
  dnsSim.emitter.on('entries', () => {
    const stats = dnsSim.getStats();
    const ratio = stats.scanned > 0 ? stats.blocked / stats.scanned : 0;
    if (ratio > 0.15)      updateThreatLevel('red');
    else if (ratio > 0.05) updateThreatLevel('amber');
    else                   updateThreatLevel('green');
  });

  // 9. Create window + tray
  mainWindow = createMainWindow();
  createTray(() => mainWindow);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    dnsSim.stop();
    etwMon.stop();
    auditLog.log({ action: 'app:quit', channel: 'system', success: true });
    app.quit();
  }
});

app.on('activate', () => {
  const { BrowserWindow } = require('electron');
  if (BrowserWindow.getAllWindows().length === 0) mainWindow = createMainWindow();
});

// Security: deny all new window creation
app.on('web-contents-created', (_, contents) => {
  contents.setWindowOpenHandler(() => ({ action: 'deny' }));
  contents.on('will-attach-webview', (e) => e.preventDefault());
});
