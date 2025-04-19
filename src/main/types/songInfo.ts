export interface SongInfo {
    title: string;
    artist: string;
    album: string;
    elapsedSeconds: number;
    totalSeconds: number;
    playing: boolean;
    albumCover: string;
    albumCoverUpdated: boolean;
    identifier: string;
    source: string;
    volume: number;
    quality?: string;
};