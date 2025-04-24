
export interface Lyric {
    timeMs: number;
    lyric: string;
}

export interface LyricData {
    rawLyrics: Array<string>;
    lyrics: Array<Lyric>;
};