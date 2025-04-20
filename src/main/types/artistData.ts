import { AlbumDataShort } from "./albumDataShort";
import { SongDataShort } from "./songData";

export interface ArtistData {
    name: string;
    source: string;
    identifier: string;
    topSongs: Array<SongDataShort>;
    relatedArtists: Array<ArtistData>;
    newAlbums: Array<AlbumDataShort>;
    imageURL?: string;
}