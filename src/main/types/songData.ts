export interface SongDataShort {
    identifier: string,
    source: string,
    title: string;
    artist: string;
    album: string;
    duration: number;
    albumCoverUrl?: string;
    index?: number;
};