import { join } from 'node:path'
import { app, BrowserWindow, shell } from 'electron'
import { registerContentIpc } from './ipc/content'
import { ContentRepository } from './repository/content-repository'
// Registers the neetcrack-video:// scheme's privileges — must be imported
// (and thus run) before app.whenReady(), see video-protocol.ts.
import { registerVideoProtocol } from './video-protocol'

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    icon: join(__dirname, '../../resources/favicon.ico'),
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Keep external links out of the app window.
  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

void app.whenReady().then(() => {
  registerVideoProtocol()
  registerContentIpc(new ContentRepository())
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
