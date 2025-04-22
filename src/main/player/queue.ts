import { mainWindow } from "..";
import { QueueData } from "../types/queueData";
import { SongDataShort } from "../types/songData";

var queueCurrentPlaying: number = 0;
var queueContents: Array<SongDataShort> = [];
// the playlist breaker is the first idx that describes when the songs start being from the playlist and not added by the user
var queuePlaylistBreaker: number = -1;

function get(): Array<SongDataShort> {
    return queueContents;
}

function getAt(idx: number): SongDataShort {
    return queueContents[idx];
}

function replaceWith(songs: Array<SongDataShort>): void {
    queueContents = songs;
    queuePlaylistBreaker = -1;
}

function add(songs: Array<SongDataShort>): void {
    if (queuePlaylistBreaker == -1)
        queueContents = queueContents.concat(songs);
    else {
        const BEFORE = queueContents.toSpliced(queuePlaylistBreaker);
        const AFTER = queueContents.toSpliced(0, queuePlaylistBreaker);
        queueContents = BEFORE.concat(songs).concat(AFTER);
        queuePlaylistBreaker += songs.length;
        mainWindow.webContents.send('updateQueue', getData());
    }
}

function addNext(song: SongDataShort): void {
    queueContents.splice(queueCurrentPlaying + 1, 0, song);
    if (queuePlaylistBreaker != -1) {
        queuePlaylistBreaker++;
        mainWindow.webContents.send('updateQueue', getData());
    }
}

function getCurrentIdx(): number {
    return queueCurrentPlaying;
}

function setCurrentIdx(idx: number) {
    queueCurrentPlaying = idx;
    if (queuePlaylistBreaker <= idx && queuePlaylistBreaker != -1) {
        queuePlaylistBreaker = idx + 1;
        mainWindow.webContents.send('updateQueue', getData());
    }
}

function removeIndex(idx: number) {
    queueContents.splice(idx, 1);
    if (queuePlaylistBreaker != -1 && queuePlaylistBreaker > idx) {
        queuePlaylistBreaker--;
        mainWindow.webContents.send('updateQueue', getData());
    }
}

function getData(): QueueData {
    return {
        queue: queueContents,
        index: queueCurrentPlaying,
        playlistBreaker: queuePlaylistBreaker == -1 ? undefined : queuePlaylistBreaker,
    };
}

function length(): number {
    return queueContents.length;
}

function setPlaylistBreaker(idx: number) {
    queuePlaylistBreaker = idx;
    mainWindow.webContents.send('updateQueue', getData());
}

export default {
    get,
    getAt,
    replaceWith,
    add,
    addNext,
    getCurrentIdx,
    setCurrentIdx,
    getData,
    removeIndex,
    length,
    setPlaylistBreaker,
};



