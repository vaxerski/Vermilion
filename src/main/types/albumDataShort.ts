import { ArtistDataShort } from "./artistDataShort";

export interface AlbumDataShort {
    name: string;
    songsNumber: number;
    duration: number;
    source: string;
    identifier: string;
    artistString: string;
    artists: Array<ArtistDataShort>;
    year?: string;
    coverUrl?: string;
};