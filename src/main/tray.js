'use strict';
const { Tray, Menu, nativeImage, app } = require('electron');
const path = require('path');

let tray = null;
let _getWindow = null;
let _pauseTimeout = null;
let _isPaused = false;

// Simple inline SVG icon data URIs (fallback if ICO assets not present)
const TRAY_ICONS = {
  green: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAASklEQVR4nO2WMQoAIAzE8v8/nR2cHFoEQZCkl2XRAQAAAID/AfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAF2kgAAAAAAAAAAAAAAAAAAAHABSIAXSGgNmFwAAAAASUVORK5CYII='),
  amber: nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAASklEQVR4nO2WMQoAIAzE8v8/nQ0cHFoEQZCkl2XRAQAAAID/AfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAF2kgAAAAAAAAAAAAAAAAAAAHABSGgNmFwAAAAASUVORK5CYII='),
  red:   nativeImage.createFromDataURL('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAASklEQVR4nO2WMQoAIAzE8v8/nQ0cHFoEQZCkl2XRAQAAAID/AfgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYAF2kgAAAAAAAAAAAAAAAAAAAHABSFgNmFwAAAAASUVORK5CYII='),
};

// Try to load real tray icons, fall back gracefully
function loadIcon(level) {
  const names = { green: 'tray-green.png', amber: 'tray-amber.png', red: 'tray-red.png' };
  try {
    const p = path.join(__dirname, '../../assets/tray', names[level]);
    const img = nativeImage.createFromPath(p);
    return img.isEmpty() ? TRAY_ICONS[level] : img;
  } catch { return TRAY_ICONS[level]; }
}

function buildMenu(getWindow) {
  return Menu.buildFromTemplate([
    {
      label: 'Open nakora',
      click: () => {
        const win = getWindow();
        if (win) { win.show(); win.focus(); }
      },
    },
    { type: 'separator' },
    {
      label: _isPaused ? 'Resume Protection' : 'Pause Protection (15 min)',
      click: () => {
        _isPaused = !_isPaused;
        if (_isPaused) {
          updateThreatLevel('amber');
          clearTimeout(_pauseTimeout);
          _pauseTimeout = setTimeout(() => {
            _isPaused = false;
            updateThreatLevel('green');
            if (tray) tray.setContextMenu(buildMenu(getWindow));
          }, 15 * 60 * 1000);
        } else {
          clearTimeout(_pauseTimeout);
          updateThreatLevel('green');
        }
        if (tray) tray.setContextMenu(buildMenu(getWindow));
      },
    },
    {
      label: 'View Status',
      click: () => {
        const win = getWindow();
        if (win) { win.show(); win.focus(); }
      },
    },
    { type: 'separator' },
    { label: 'Quit nakora', click: () => app.quit() },
  ]);
}

function createTray(getWindow) {
  _getWindow = getWindow;
  tray = new Tray(loadIcon('green'));
  tray.setToolTip('nakora — DNS Security Shield');
  tray.setContextMenu(buildMenu(getWindow));
  tray.on('click', () => {
    const win = getWindow();
    if (win) { win.show(); win.focus(); }
  });
}

function updateThreatLevel(level) {
  if (!tray) return;
  tray.setImage(loadIcon(level));
  tray.setToolTip(`nakora — Threat: ${level.toUpperCase()}`);
  if (_getWindow) tray.setContextMenu(buildMenu(_getWindow));
}

module.exports = { createTray, updateThreatLevel };
