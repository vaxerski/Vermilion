import { AlbumDataShort } from "./albumDataShort";
import { ArtistData } from "./artistData";
import { SongDataShort } from "./songData";

export interface SearchResults {
    songs: Array<SongDataShort>;
    artists: Array<ArtistData>;
    albums: Array<AlbumDataShort>;
}