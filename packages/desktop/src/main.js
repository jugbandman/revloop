import { app, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let tray = null;
let isRecording = false;

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'iconTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('RevLoop');

  updateMenu();
}

function updateMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: isRecording ? 'Stop Recording' : 'Start Recording',
      click: () => {
        isRecording = !isRecording;
        console.log(isRecording ? 'Recording started' : 'Recording stopped');
        updateMenu();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  // Hide dock icon since this is a menu bar app
  app.dock?.hide();

  createTray();
  console.log('RevLoop is ready');
});

app.on('window-all-closed', (e) => {
  // Prevent app from quitting when no windows are open
  e.preventDefault();
});
