import { SongDataShort } from "./songData";

export interface AlbumData {
    name: string;
    artist: string;
    source: string;
    identifier: string;
    songs: Array<SongDataShort>;
    year?: string;
    date?: string;
    copyright?: string;
    coverUrl?: string;
    coverVideoUrl?: string;
};