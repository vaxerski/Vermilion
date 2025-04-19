import config from "../../config/config";
import { SongInfo } from "../../types/songInfo";

var mpris = require('mpris-service');

let lastAlbumCover = "";
let enabled = true;

var mprisPlayer = mpris(
    {
        name: 'Vermilion',
        identity: 'Vermilion Music Player',
        supportedInterfaces: ['player']
    }
);

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
            'xesam:album': song.album,
            'xesam:artist': [song.artist]
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
                name: 'Vermilion',
                identity: 'Vermilion Music Player',
                supportedInterfaces: ['player']
            }
        );
}

export default {
    updateSongInfo,
    setEnabled,
};