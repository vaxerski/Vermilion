import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('electronAPI', {
      updateCurrentSong: (callback) => ipcRenderer.on('updateCurrentSong',
        (_event, value) => callback(value)
      ),
      updateMpdSongList: (callback) => ipcRenderer.on('updateMpdSongList',
        (_event, value) => callback(value)
      ),
      updateTidalSearch: (callback) => ipcRenderer.on('updateTidalSearch',
        (_event, value) => callback(value)
      ),
      updateYtSearch: (callback) => ipcRenderer.on('updateYtSearch',
        (_event, value) => callback(value)
      ),
      updateQueue: (callback) => ipcRenderer.on('updateQueue',
        (_event, value) => callback(value)
      ),
      sendSetting: (callback) => ipcRenderer.on('sendSetting',
        (_event, value) => callback(value)
      ),
      newNotification: (callback) => ipcRenderer.on('newNotification',
        (_event, value) => callback(value)
      ),
      playTidal: (callback) => ipcRenderer.on('playTidal',
        (_event, value) => callback(value)
      ),
      tidalPlayEvent: (callback) => ipcRenderer.on('tidalPlayEvent',
        (_event, value) => callback(value)
      ),
      updatePlaylists: (callback) => ipcRenderer.on('updatePlaylists',
        (_event, value) => callback(value)
      ),
      playlistData: (callback) => ipcRenderer.on('playlistData',
        (_event, value) => callback(value)
      ),
      pageUpdated: (callback) => ipcRenderer.on('pageUpdated',
        (_event, value) => callback(value)
      ),
      artistData: (callback) => ipcRenderer.on('artistData',
        (_event, value) => callback(value)
      ),
      albumData: (callback) => ipcRenderer.on('albumData',
        (_event, value) => callback(value)
      ),
      playGeneric: (callback) => ipcRenderer.on('playGeneric',
        (_event, value) => callback(value)
      ),
      genericPlayerPlayEvent: (callback) => ipcRenderer.on('genericPlayerPlayEvent',
        (_event, value) => callback(value)
      ),
    })
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}