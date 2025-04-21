import config from "../../config/config";
import { SongInfo } from "../../types/songInfo";

var mpris = require('mpris-service');

let lastAlbumCover = "";
let enabled = false;

var mprisPlayer = null;

function updateSongInfo(song: SongInfo) {
    if (song.albumCoverUpdated)
        lastAlbumCover = song.albumCover;

    mprisPlayer.playbackStatus = song.playing ? 'Playing' : 'Paused';

    if (song.playing) {
        mprisPlayer.metadata = {
            'mpris:trackid': mprisPlayer.objectPath('track/0'),
            'mpris:length': song.totalSeconds * 1000 * 1000, // In microseconds for whatever reason
            'mpris:artUrl': lastAlbumCover,
            'xesam:title': song.title,
            'custom:title': song.title,
            'xesam:album': song.album,
            'custom:album': song.album,
            'xesam:artist': [song.artist],
            'custom:artist': [song.artist],
            "custom:status": song.playing ? 'playing' : 'paused',
        };
    }
}

function setEnabled(enable: boolean) {
    if (enabled == enable)
        return;

    enabled = enable;
    if (!enabled)
        mprisPlayer = undefined;
    else
        mprisPlayer = mpris(
            {
                name: 'vermilion',
                identity: 'Vermilion Music Player',
                supportedInterfaces: ['player']
            }
        );
}

export default {
    updateSongInfo,
    setEnabled,
};