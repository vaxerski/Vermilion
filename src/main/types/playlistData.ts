import { SongDataShort } from "./songData";


export interface PlaylistData {
    name: string;
    songs: Array<SongDataShort>;
    source: string;
    identifier: string;
    albumUrl?: string;
    gatheredAt?: number;
};