import { ArtistDataShort } from "./artistDataShort";
import { PlaylistData } from "./playlistData";

export interface SongDataShort {
    identifier: string,
    source: string,
    title: string;
    artistString: string;
    artists?: Array<ArtistDataShort>;
    album: string;
    albumId?: string;
    duration: number;
    albumCoverUrl?: string;
    albumVideoCoverUrl?: string;
    index?: number;
    playlist?: string;
};