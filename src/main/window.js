'use strict';
const { BrowserWindow, screen } = require('electron');
const path = require('path');
const os = require('os');
const { CSP, DEV_CSP } = require('./csp.js');

const isDev = process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged;

// Windows 11 ships with build >= 22000; titleBarOverlay WCO only reliable there
function isWindows11() {
  if (process.platform !== 'win32') return false;
  return parseInt(os.release().split('.')[2] || '0', 10) >= 22000;
}

// Window state stored in electron-store (injected after store initialises)
let _store = null;
function setStore(store) { _store = store; }

function getWindowBounds() {
  if (!_store) return { width: 1280, height: 840 };
  return _store.get('windowBounds', { width: 1280, height: 840, x: undefined, y: undefined });
}

function saveWindowBounds(win) {
  if (!_store) return;
  const b = win.getBounds();
  _store.set('windowBounds', { width: b.width, height: b.height, x: b.x, y: b.y });
}

function createMainWindow() {
  const bounds = getWindowBounds();
  const win11 = isWindows11();

  const win = new BrowserWindow({
    width:     bounds.width,
    height:    bounds.height,
    x:         bounds.x,
    y:         bounds.y,
    minWidth:  960,
    minHeight: 640,
    // Win11: frameless with native WCO overlay; Win10: standard OS frame
    frame:     !win11,
    ...(win11 ? {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color:       '#040804',
        symbolColor: '#00cc33',
        height:      32,
      },
    } : {}),
    backgroundColor: '#040804',
    show: false,
    webPreferences: {
      preload:                     path.join(__dirname, '../preload/index.js'),
      contextIsolation:            true,
      nodeIntegration:             false,
      sandbox:                     true,
      webSecurity:                 true,
      allowRunningInsecureContent: false,
    },
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [isDev ? DEV_CSP : CSP],
        'X-Content-Type-Options':  ['nosniff'],
        'X-Frame-Options':         ['DENY'],
      },
    });
  });

  // Prevent new windows from opening
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  // Block navigation away from app origin
  win.webContents.on('will-navigate', (e, url) => {
    if (isDev && url.startsWith('http://localhost:5173')) return;
    if (!isDev && url.startsWith('app://')) return;
    e.preventDefault();
  });

  // Persist window bounds on close
  win.on('close', () => saveWindowBounds(win));

  // Show once loaded
  win.once('ready-to-show', () => win.show());

  // Load app
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadURL('app://nakora/');
  }

  return win;
}

module.exports = { createMainWindow, setStore };
