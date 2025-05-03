const ytmusic = require("ytmusic_api_unofficial");
import { SearchResults } from "../../types/searchResults";
import { mainWindow } from "../..";
import { SongInfo } from "../../types/songInfo";
import { SongDataShort } from "../../types/songData";
import { AlbumDataShort } from "../../types/albumDataShort";
import config from "../../config/config";
import { Album, Artist, Music } from "ytmusic_api_unofficial";
import { ArtistDataShort } from "../../types/artistDataShort";
import { isWindows } from "../../helpers/helpers";
const YTDlpWrap = require('yt-dlp-wrap').default;

let ytDlpWrap;
function newYTDlpWrap(): void {
    if (ytDlpWrap) return;

    if (isWindows) {
        const binarypath = config.getConfigValue("ytBinaryPath");
        ytDlpWrap = new YTDlpWrap(binarypath);
    }
    else ytDlpWrap = new YTDlpWrap();
}

// With yt, we get elapsed fed from the render thread
let playbackData: SongInfo = {
    title: "Nothing is playing",
    artist: "",
    album: "",
    elapsedSeconds: 0,
    totalSeconds: 0,
    playing: false,
    albumCover: "",
    albumCoverUpdated: false,
    identifier: "",
    source: "yt",
    volume: -1,
};

let idToAlbumMap: Map<string, AlbumDataShort> = new Map();
let idToShortDataMap: Map<string, SongDataShort> = new Map();

function toArtistDataShort(s: Artist): ArtistDataShort {
    return {
        name: s.name,
        identifier: s.id + "",
        source: ""
    };
}

function toSongDataShort(s: Music): SongDataShort {
    let artists: Array<ArtistDataShort> = [];
    let artistString: string = "";
    s.artists.forEach((x) => {
        artists.push(toArtistDataShort(x));
        artistString += x.name + ", ";
    });
    artistString = artistString.substring(0, artistString.length - 2);

    return {
        identifier: s.id,
        source: "yt",
        title: s.title,
        artists: artists,
        artistString: artistString,
        album: s.album.name,
        albumId: s.album.id + "",
        duration: s.duration.duration,
        albumCoverUrl: s.thumbnails.length == 0 ? undefined : s.thumbnails[s.thumbnails.length - 1].url,
    };
}

async function performSearch(query: string): Promise<SearchResults> {
    return new Promise<SearchResults>(
        async (res, rej) => {
            let result: SearchResults = {
                songs: [],
                albums: [],
                artists: []
            };

            // Do this synchronously to avoid a 429.
            const YT_SONGS = await ytmusic.search(query, "SONG");
            const YT_ALBUMS = await ytmusic.search(query, "ALBUM");
            const YT_ARTISTS = await ytmusic.search(query, "ARTIST");

            console.log("yt: got " + YT_SONGS.length + " songs");

            YT_SONGS.content.forEach((s: Music) => {
                const SHORT_DATA = toSongDataShort(s);

                result.songs.push(SHORT_DATA);

                if (!idToShortDataMap.has(s.id + ""))
                    idToShortDataMap.set(s.id + "", SHORT_DATA);

                if (!idToAlbumMap.has(s.id + "")) {
                    let artists: Array<ArtistDataShort> = [];
                    let artistString: string = "";
                    s.artists.forEach((x) => {
                        artists.push(toArtistDataShort(x));
                        artistString += x.name + ", ";
                    });
                    artistString = artistString.substring(0, artistString.length - 2);

                    idToAlbumMap.set(s.id + "", {
                        name: s.album.name,
                        identifier: s.album.id + "",
                        source: "yt",
                        songsNumber: 0,
                        duration: 0,
                        artists: artists,
                        artistString: artistString,
                    });
                }
            });

            console.log("yt: got " + YT_ALBUMS.length + " albums");

            YT_ALBUMS.content.forEach((a: Album) => {
                let artists: Array<ArtistDataShort> = [];
                let artistString: string = "";
                a.artists.forEach((x) => {
                    artists.push(toArtistDataShort(x));
                    artistString += x.name + ", ";
                });
                artistString = artistString.substring(0, artistString.length - 2);
                result.albums.push({
                    name: a.name,
                    artists: artists,
                    artistString: artistString,
                    source: "yt",
                    identifier: a.id + "",
                    songsNumber: 0,
                    duration: 0,
                    coverUrl: a.thumbnails.length == 0 ? undefined : a.thumbnails[0].url,
                });
            });

            console.log("yt: got " + YT_ARTISTS.length + " artists");

            YT_ARTISTS.content.forEach((a: Artist) => {
                result.artists.push({
                    name: a.name,
                    identifier: a.id + "",
                    source: "yt",
                    topSongs: [],
                    relatedArtists: [],
                    newAlbums: [],
                    imageURL: a.thumbnails.length == 0 ? undefined : a.thumbnails[0].url,
                });
            });


            res(result);
        }
    );
}

async function play(identifier: string) {
    return new Promise<boolean>(async (res, rej) => {
        newYTDlpWrap();
        identifier = identifier.replaceAll(/[^A-Za-z-0-9\-\_ ]/g, '');

        let params: string[] = [
            "https://youtube.com/watch?v=" + identifier,
            "-x",
            "-f",
            "bestaudio"
        ];

        const BROWSER_FOR_COOKIES = config.getConfigValue("ytCookieSource");
        if (BROWSER_FOR_COOKIES != "")
            params = params.concat(["--cookies-from-browser", BROWSER_FOR_COOKIES]);

        try {
            let stream = ytDlpWrap.execStream(params);
            let fullData: Buffer = Buffer.alloc(0);
            stream.on('data', (data: Buffer) => {
                console.log("yt stream: got " + data.byteLength + " bytes");

                fullData = Buffer.concat([
                    fullData, data
                ]);

                const B64 = "data:audio/ogg;base64," + Buffer.from(fullData).toString('base64');
                mainWindow.webContents.send('playGeneric', B64);
            });
        }
        catch (e) {
            res(false);
        }

        playbackData.playing = true;
        playbackData.identifier = identifier;
        playbackData.elapsedSeconds = 0;

        songFromID(identifier).then((data) => {
            if (data.duration == 0) {
                playbackData.title = "";
                playbackData.album = "";
                playbackData.artist = "Blocked from API";
                playbackData.albumCover = "";
                playbackData.totalSeconds = 0;
                playbackData.elapsedSeconds = 0;
            } else {
                playbackData.title = data.title;
                playbackData.album = data.album;
                playbackData.artist = data.artistString;
                playbackData.albumCover = data.albumCoverUrl;
                playbackData.totalSeconds = data.duration;
                playbackData.albumCoverUpdated = true;
            }
        });

        res(true);
    });
}

async function seek(seconds: number) {
    return new Promise<boolean>(
        async (res) => {
            if (playbackData.totalSeconds == 0) {
                res(false);
                return;
            }
            mainWindow.webContents.send('genericPlayerPlayEvent', {
                seek: seconds,
            });
            res(true);
        }
    );
}

async function setVolume(vol: number) {
    return new Promise<boolean>(
        async (res) => {
            mainWindow.webContents.send('genericPlayerPlayEvent', {
                volume: Math.round(vol) / 100
            });
            res(true);
        }
    );
}

async function getPlayState(): Promise<SongInfo> {
    return new Promise<SongInfo>(
        (res) => {
            let pbdata = { ...playbackData }; // clone
            playbackData.albumCoverUpdated = false;
            res(pbdata);
        }
    );
}

async function pausePlay(play: boolean): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            mainWindow.webContents.send('genericPlayerPlayEvent', {
                play: play
            });
            playbackData.playing = play;
            res(true);
        }
    );
}

async function elapsed(seconds: number) {
    playbackData.elapsedSeconds = seconds;
}

async function songFromID(identifier: string): Promise<SongDataShort> {
    return new Promise<SongDataShort>(async (res) => {

        let sd: SongDataShort = {
            identifier: identifier,
            source: "yt",
            title: "Unknown title",
            artistString: "",
            album: "",
            duration: 0,
        };

        identifier = identifier.replaceAll(/[^A-Za-z-0-9\-\_ ]/g, '');

        ytmusic.get(identifier).then((s: Music) => {
            const HAS_ALBUM = idToAlbumMap.has(identifier);

            let artists: Array<ArtistDataShort> = [];
            let artistString: string = "";
            s.artists.forEach((x) => {
                artists.push(toArtistDataShort(x));
                artistString += x.name + ", ";
            });
            artistString = artistString.substring(0, artistString.length - 2);

            sd = {
                identifier: s.id + "",
                source: "yt",
                title: s.title,
                artists: artists,
                artistString: artistString,
                album: HAS_ALBUM ? idToAlbumMap.get(identifier).name : "",
                albumId: HAS_ALBUM ? idToAlbumMap.get(identifier).identifier : undefined,
                albumCoverUrl: HAS_ALBUM ? idToAlbumMap.get(identifier).coverUrl : undefined,
                duration: s.duration.duration,
            };
            res(sd);
        }).catch(async (e) => {
            console.log("yt: song " + identifier + " errd, likely blocked. Checking cache, then trying a search.");
            if (idToShortDataMap.has(identifier)) {
                console.log("yt: song is in cache, returning that");
                res(idToShortDataMap.get(identifier));
                return;
            }

            console.log("yt: song is not cached, searching");

            const YT_SONGS = await ytmusic.search(identifier, "SONG");

            if (YT_SONGS.length == 0) {
                console.log("yt: search didn't yield anything :(");
                res(sd);
                return;
            }

            let found: boolean = false;
            YT_SONGS.forEach((s) => {
                if (s.videoId != identifier || found)
                    return;

                found = true;
                console.log("yt: search found the id");

                const SHORT_DATA = toSongDataShort(s);
                res(SHORT_DATA);
            });

            if (!found) {
                console.log("yt: nothing worked. :(");
                console.log(e);
                res(sd);
            }
        });
    });
}

export default {
    elapsed,
    seek,
    pausePlay,
    getPlayState,
    setVolume,
    performSearch,
    play,
    songFromID
}