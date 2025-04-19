import { QueueData } from "../types/queueData";
import { SongDataShort } from "../types/songData";

var queueCurrentPlaying: number = 0;
var queueContents: Array<SongDataShort> = [];

function get(): Array<SongDataShort> {
    return queueContents;
}

function replaceWith(songs: Array<SongDataShort>): void {
    queueContents = songs;
}

function add(songs: Array<SongDataShort>): void {
    songs.forEach((e) => { queueContents.push(e); });
}

function getCurrentIdx(): number {
    return queueCurrentPlaying;
}

function setCurrentIdx(idx: number) {
    queueCurrentPlaying = idx;
}

function getData(): QueueData {
    return {
        queue: queueContents,
        index: queueCurrentPlaying
    };
}

export default {
    get,
    replaceWith,
    add,
    getCurrentIdx,
    setCurrentIdx,
    getData,
};



