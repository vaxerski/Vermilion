import { PlaylistData } from "./playlistData";

export interface SongDataShort {
    identifier: string,
    source: string,
    title: string;
    artist: string;
    artistId?: string;
    album: string;
    albumId?: string;
    duration: number;
    albumCoverUrl?: string;
    index?: number;
    playlist?: string;
};