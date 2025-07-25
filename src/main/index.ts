import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import player from './player/player'
import queue from './player/queue'
import config from './config/config'
import { SongDataShort } from './types/songData'
import mpd from './player/mpd/mpd'
import tidal from './player/tidal/tidal'
import externalServices from './player/externalServices'
import { PlaylistData } from './types/playlistData'
import { PlaylistDataShort } from './types/playlistDataShort'
import yt from './player/yt/yt'
import spotify from './player/spotify/spotify'

export var mainWindow: BrowserWindow;

let loginState = {
  spotify: false,
  tidal: false,
  mpd: false
};

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      additionalArguments: [
        "--no-zygote",
        "--no-sandbox",
      ]
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  });

  setInterval(
    () => {
      player.getCurrentSong().then((msg) => {
        mainWindow.webContents.send('updateCurrentSong', msg);
        externalServices.updateSongInfo(msg);
      }).catch((e) => { });
    }
    , 500);

  // IPC test
  ipcMain.on('pausePlayback', () => {
    player.pausePlay(false).then(() => {
      player.getCurrentSong().then((msg) => {
        mainWindow.webContents.send('updateCurrentSong', msg);
      });
    });
  });
  ipcMain.on('resumePlayback', () => {
    player.pausePlay(true).then(() => {
      player.getCurrentSong().then((msg) => {
        mainWindow.webContents.send('updateCurrentSong', msg);
      });
    });
  });

  ipcMain.on('playNext', () => {
    player.playNextPrev(true).then(() => {
      player.getCurrentSong().then((msg) => {
        mainWindow.webContents.send('updateCurrentSong', msg);
      });
    });
  });
  ipcMain.on('playPrevious', () => {
    player.playNextPrev(false).then(() => {
      player.getCurrentSong().then((msg) => {
        mainWindow.webContents.send('updateCurrentSong', msg);
      });
    });
  });

  ipcMain.on('playSong', (ev, data) => {
    if (data.queue == true) {
      // if we are in a queue, we're just skipping in the queue.
      const QUEUE = queue.get();

      if (QUEUE.length > data.index) {
        queue.setCurrentIdx(data.index);
        player.playSong(QUEUE[data.index].identifier, QUEUE[data.index].source).then(() => {
          player.getCurrentSong().then((msg) => {
            mainWindow.webContents.send('updateCurrentSong', msg);
          });
        });
      }
    } else {
      // if we aren't, we are overriding the queue.
      // play the song immediately, figure out the queue next.
      player.playSong(data.identifier, data.source).then(() => {
        player.getCurrentSong().then((msg) => {
          mainWindow.webContents.send('updateCurrentSong', msg);
        });
      });

      if (data.songs && data.songs.length > 0) {
        // if we are playing a song from a playlist, album, or whatever, override the queue with the playlist sliced from the current song
        queue.replaceWith(data.songs.slice(data.index));
        queue.setCurrentIdx(0);
        queue.setPlaylistBreaker(1);
      } else {
        // otherwise just make the song the current queue
        player.songFromID(data.identifier, data.source).then((song: SongDataShort) => {
          queue.replaceWith([song]);
          mainWindow.webContents.send('updateQueue', queue.getData());
        });
      }
    }
  });

  ipcMain.on('playbackSeek', (ev, data) => {
    player.getCurrentSong().then((msg) => {
      player.seekCurrentSong(data * msg.totalSeconds);
      mainWindow.webContents.send('updateCurrentSong', msg);
    });
  });

  ipcMain.on('addToQueue', (ev, data) => {
    player.songFromID(data.identifier, data.source).then((song: SongDataShort) => {
      queue.add([song]);
      mainWindow.webContents.send('updateQueue', queue.getData());

      if (!player.getPlayerState().playing) {
        // play the song immediately if we aren't playing anything
        player.playSong(data.identifier, data.source).then(() => {
          player.getCurrentSong().then((msg) => {
            mainWindow.webContents.send('updateCurrentSong', msg);
          });
        });
        queue.setCurrentIdx(queue.length() - 1);
      }
    });
  });

  ipcMain.on('addToQueueAsNext', (ev, data) => {
    player.songFromID(data.identifier, data.source).then((song: SongDataShort) => {
      queue.addNext(song);
      mainWindow.webContents.send('updateQueue', queue.getData());
    });
  });

  ipcMain.on('removeFromQueue', (ev, data) => {
    if (queue.getCurrentIdx() != data.index) {
      // if we aren't playing the current idx, it's simple, just remove it and update current idx
      queue.removeIndex(data.index);
      queue.setCurrentIdx(queue.getCurrentIdx() - (data.index > queue.getCurrentIdx() ? 0 : 1));
      mainWindow.webContents.send('updateQueue', queue.getData());
    } else {
      // if we are playing the song we want to remove, play the next if possible
      if (queue.getCurrentIdx() + 1 < queue.length()) {
        // we can play the next song
        const next = queue.getAt(queue.getCurrentIdx() + 1);
        queue.removeIndex(queue.getCurrentIdx());
        player.playSong(next.identifier, next.source).then(() => {
          player.getCurrentSong().then((msg) => {
            mainWindow.webContents.send('updateCurrentSong', msg);
          });
          mainWindow.webContents.send('updateQueue', queue.getData());
        });
      } else {
        // nothing to play after this. Just stop and bail
        player.pausePlay(false);
        queue.removeIndex(queue.getCurrentIdx());
        mainWindow.webContents.send('updateQueue', queue.getData());
        player.getCurrentSong().then((msg) => {
          mainWindow.webContents.send('updateCurrentSong', msg);
        });
      }
    }
  });

  ipcMain.on('removeFromPlaylist', (ev, data) => {
    // data is {song, playlist}
    player.removeFromPlaylist(data.song, data.playlist).then(() => {
      console.log("e");
      player.uncachePlaylist(data.playlist)
      mainWindow.webContents.send('reloadPlaylist', data.playlist);
    });
  });

  ipcMain.on('addToPlaylist', (ev, data) => {
    // data is {song, playlist}
    player.addToPlaylist(data.song, data.playlist).then(() => {
      player.uncachePlaylist(data.playlist)
    });
  });


  ipcMain.on('mpdGetSongs', (ev, data) => {
    mpd.listSongs(data).then((res) => {
      mainWindow.webContents.send('updateMpdSongList', res);
    })
  });

  ipcMain.on('tidalGetSongs', (ev, data) => {
    tidal.performSearch(data).then((res) => {
      mainWindow.webContents.send('updateTidalSearch', res);
    }).catch((e) => {
      mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Tidal query failed: " + e + "." });
    })
  });

  ipcMain.on('ytGetSongs', (ev, data) => {
    yt.performSearch(data).then((res) => {
      mainWindow.webContents.send('updateYtSearch', res);
    }).catch((e) => {
      mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "YT Music query failed: " + e + "." });
    })
  });

  ipcMain.on('spotifyGetSongs', (ev, data) => {
    spotify.performSearch(data).then((res) => {
      mainWindow.webContents.send('updateSpotifySearch', res);
    }).catch((e) => {
      mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Spotify query failed: " + e + "." });
    })
  });

  ipcMain.on('tidalElapsed', (ev, data) => {
    tidal.elapsed(data);
  });

  ipcMain.on('genericPlayerElapsed', (ev, data) => {
    yt.elapsed(data);
  });

  ipcMain.on('setVolume', (ev, data) => {
    config.setConfigValue("volume", parseInt(data));
    player.setVolume(data);
  });

  ipcMain.on('gatherPlaylists', (ev, data) => {
    player.updatePlaylists();
  });

  ipcMain.on('getPlaylistData', (ev, data) => {
    player.getPlaylistData(data).then((res) => {
      mainWindow.webContents.send('playlistData', res);
    })
  });

  ipcMain.on('getArtistData', (ev, data) => {
    // FIXME: route thru player? maybe make a new class for metadata
    if (data.source == "tidal") {
      tidal.getArtistData(data.identifier).then((res) => {
        mainWindow.webContents.send('artistData', res);
      }).catch((e) => {
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Query failed: " + e + "." });
      });
    } else if (data.source == "spotify") {
      spotify.getArtistData(data.identifier).then((res) => {
        mainWindow.webContents.send('artistData', res);
      }).catch((e) => {
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Query failed: " + e + "." });
      });
    }
  });

  ipcMain.on('getAlbumData', (ev, data) => {
    // FIXME: route thru player? maybe make a new class for metadata
    if (data.source == "tidal") {
      tidal.getAlbumData(data.identifier).then((res) => {
        mainWindow.webContents.send('albumData', res);
      }).catch((e) => {
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Query failed: " + e + "." });
      });
    } else if (data.source == "spotify") {
      spotify.getAlbumData(data.identifier).then((res) => {
        mainWindow.webContents.send('albumData', res);
      }).catch((e) => {
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Query failed: " + e + "." });
      });
    }
  });

  ipcMain.on('pageGotChanged', (ev, data) => {
    mainWindow.webContents.send('pageChanged', data);
    mainWindow.webContents.send('loginState', loginState);
  });

  ipcMain.on('openLink', (ev, data) => {
    shell.openExternal(data);
  });

  ipcMain.on('setSetting', (ev, data) => {
    if (config.getConfigValue(data.setting) == data.value)
      return;

    config.setConfigValue(data.setting, data.value);

    if (data.setting.indexOf("mpd") == 0) {
      mpd.reconnect(config.getConfigValue("mpdAddress"), parseInt(config.getConfigValue("mpdPort"))).then((res) => {
        if (!res) {
          mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Couldn't connect to mpd at " + config.getConfigValue("mpdAddress") + ":" + config.getConfigValue("mpdPort") + "." });
        } else {
          mainWindow.webContents.send('newNotification', { color: "#00b30033", text: "Connected to mpd" });
        }

        mainWindow.webContents.send('loginState', { mpd: !!res });
        loginState.mpd = !!res;
      })
    }
  });

  ipcMain.on('getSetting', (ev, data) => {
    let val = config.getConfigValue(data);
    mainWindow.webContents.send('sendSetting', { setting: data, value: val });
  });

  ipcMain.on('spotifyDeviceID', (ev, data) => {
    spotify.setDeviceID(data);
  });

  ipcMain.on('loginSpotify', (ev, data) => {
    spotify.attemptNewSession().then((result) => {
      if (result) {
        mainWindow.webContents.send('newNotification', { color: "#00b30033", text: "Logged into Spotify" });
        mainWindow.webContents.send('spotifyLoggedIn');
      } else
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Couldn't log into Spotify" });

      mainWindow.webContents.send('loginState', { spotify: !!result });
      loginState.spotify = !!result;
    });
  });

  ipcMain.on('loginTidal', (ev, data) => {
    tidal.login().then((e) => {
      if (e)
        mainWindow.webContents.send('newNotification', { color: "#00b30033", text: "Logged into Tidal" });
      else
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Couldn't log into Tidal" });

      player.updatePlaylists();

      mainWindow.webContents.send('loginState', { tidal: !!e });
      loginState.tidal = !!tidal;
    });
  });

  ipcMain.on('spotifyElapsed', (ev, data) => {
    spotify.elapsed(data);
  });

  config.loadConfig();

  createWindow();

  mainWindow.webContents.setWindowOpenHandler((details) => {
    return { action: 'deny' }
  });

  player.initPlayer();

  setTimeout(() => {
    player.getCurrentSong().then((msg) => {
      if (msg.identifier == "")
        return;
      let si: SongDataShort = {
        identifier: msg.identifier,
        source: msg.source,
        title: msg.title,
        artists: [],
        artistString: msg.artist,
        album: msg.album,
        duration: msg.totalSeconds
      }
      queue.replaceWith([si]);
      queue.setCurrentIdx(0);
      mainWindow.webContents.send('updateQueue', queue.getData());
      player.setVolume(config.getConfigValue("volume"));
    });

    spotify.login().then((e) => {
      if (e) {
        mainWindow.webContents.send('newNotification', { color: "#00b30033", text: "Logged into Spotify" });
        mainWindow.webContents.send('spotifyLoggedIn');
      } else
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Couldn't log into Spotify" });

      player.updatePlaylists();

      mainWindow.webContents.send('loginState', { spotify: !!e });
      loginState.spotify = !!e;
    });

    tidal.login().then((e) => {
      if (e)
        mainWindow.webContents.send('newNotification', { color: "#00b30033", text: "Logged into Tidal" });
      else
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Couldn't log into Tidal" });

      player.updatePlaylists();

      mainWindow.webContents.send('loginState', { tidal: !!e });
      loginState.tidal = !!e;
    });

    mpd.reconnect(config.getConfigValue("mpdAddress"), parseInt(config.getConfigValue("mpdPort"))).then((e) => {
      if (!e) {
        mainWindow.webContents.send('newNotification', { color: "#b3000033", text: "Couldn't connect to mpd at " + config.getConfigValue("mpdAddress") + ":" + config.getConfigValue("mpdPort") + "." });
      } else {
        mainWindow.webContents.send('newNotification', { color: "#00b30033", text: "Connected to mpd" });
      }

      mainWindow.webContents.send('loginState', { mpd: !!e });
      loginState.mpd = !!e;
    });
  }, 500);

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
