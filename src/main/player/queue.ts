import { QueueData } from "../types/queueData";
import { SongDataShort } from "../types/songData";

var queueCurrentPlaying: number = 0;
var queueContents: Array<SongDataShort> = [];

function get(): Array<SongDataShort> {
    return queueContents;
}

function getAt(idx: number): SongDataShort {
    return queueContents[idx];
}

function replaceWith(songs: Array<SongDataShort>): void {
    queueContents = songs;
}

function add(songs: Array<SongDataShort>): void {
    songs.forEach((e) => { queueContents.push(e); });
}

function addNext(song: SongDataShort): void {
    queueContents.splice(queueCurrentPlaying + 1, 0, song);
}

function getCurrentIdx(): number {
    return queueCurrentPlaying;
}

function setCurrentIdx(idx: number) {
    queueCurrentPlaying = idx;
}

function removeIndex(idx: number) {
    queueContents.splice(idx, 1);
}

function getData(): QueueData {
    return {
        queue: queueContents,
        index: queueCurrentPlaying
    };
}

function length(): number {
    return queueContents.length;
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
};



