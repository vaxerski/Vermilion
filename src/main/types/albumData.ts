import { SongDataShort } from "./songData";

export interface AlbumData {
    name: string;
    artist: string;
    source: string;
    identifier: string;
    songs: Array<SongDataShort>;
    year?: string;
    coverUrl?: string;
};