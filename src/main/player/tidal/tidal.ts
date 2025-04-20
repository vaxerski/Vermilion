import { mainWindow } from "../..";
import config from "../../config/config";
import { PlaylistDataShort } from "../../types/playlistDataShort";
import { PlaylistData } from "../../types/playlistData";
import { SongDataShort } from "../../types/songData";
import { SongInfo } from "../../types/songInfo";
import { SearchResults } from "../../types/searchResults";
import { ArtistData } from "../../types/artistData";
import { AlbumData } from "../../types/albumData";

function getToken() {
    return config.getConfigValue("tidalToken");
}

const TIDAL_URL = "https://listen.tidal.com/";
const TIDAL_RESOURCES_URL = "https://resources.tidal.com/";
const TIDAL_SEARCH_API_ENDPOINT = "v2/search/"
const TIDAL_TRACK_API_ENDPOINT = "v1/tracks/"
const TIDAL_PLAYBACKINFO_ENDPOINT_AFTER = "/playbackinfo"
const TIDAL_SESSION_API_ENDPOINT = "v1/sessions"
const TIDAL_FOLDERS_API_ENDPOINT = "v2/my-collection/playlists/folders"
const TIDAL_PLAYLISTS_API_ENDPOINT = "v1/playlists"
const TIDAL_ARTIST_API_ENDPOINT = "v1/pages/artist"
const TIDAL_ALBUM_API_ENDPOINT = "v1/pages/album"

let TIDAL_SESSION_ID = "";
let TIDAL_COUNTRY_CODE = "US";

// With tidal, we get elapsed fed from the render thread
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
    source: "mpd",
    volume: -1,
};

async function performSearch(searchFor: string): Promise<SearchResults> {
    return new Promise<SearchResults>(
        async (res, rej) => {
            const TOKEN = getToken();

            if (TOKEN == "") {
                rej("No Tidal token configured");
                return;
            }

            // rid of all bad chars
            searchFor = searchFor.replaceAll(/[^A-Za-z-0-9 ]/g, '');

            console.log("Searching Tidal for \"" + searchFor + "\"");

            let result: SearchResults = {
                songs: [],
                artists: [],
                albums: [],
            };

            try {
                const response =
                    await fetch(
                        TIDAL_URL + TIDAL_SEARCH_API_ENDPOINT + "?includeContributors=true&includeDidYouMean=true&includeUserPlaylists=false&limit=10&types=TRACKS,ARTISTS,ALBUMS&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&query=" + searchFor,
                        {
                            method: 'GET',
                            headers: {
                                "Accept": "application/json",
                                "authorization": "Bearer " + TOKEN,
                                "Host": "listen.tidal.com"
                            }
                        }
                    );

                response.json().then((data) => {
                    if (data.tracks.items.length != 0) {
                        console.log("Tidal returned " + data.tracks.items.length + " tracks.");

                        data.tracks.items.forEach((e) => {
                            result.songs.push(
                                {
                                    title: e.title,
                                    album: e.album ? e.album.title : "unknown",
                                    albumId: e.album ? "" + e.album.id : undefined,
                                    duration: e.duration,
                                    artist: e.artists[0].name,
                                    artistId: "" + e.artists[0].id,
                                    source: "tidal",
                                    identifier: "" + e.id,
                                    albumCoverUrl: e.album && e.album.cover ? (TIDAL_RESOURCES_URL + "images/" + e.album.cover.replaceAll('-', '/') + "/1280x1280.jpg") : undefined,
                                }
                            );
                        });
                    } else
                        console.log("Tidal: no tracks for query");

                    if (data.artists.items.length != 0) {
                        console.log("Tidal returned " + data.artists.items.length + " artists.");

                        data.artists.items.forEach((e) => {
                            const COVER = e.picture ? e.picture : (e.selectedAlbumCoverFallback ? e.selectedAlbumCoverFallback : undefined);

                            result.artists.push(
                                {
                                    name: e.name,
                                    source: "tidal",
                                    identifier: "" + e.id,
                                    imageURL: COVER ? (TIDAL_RESOURCES_URL + "images/" + COVER.replaceAll('-', '/') + "/1280x1280.jpg") : undefined,
                                    topSongs: [],
                                    relatedArtists: [],
                                    newAlbums: [],
                                }
                            );
                        });
                    } else
                        console.log("Tidal: no artists for query");

                    if (data.albums.items.length != 0) {
                        console.log("Tidal returned " + data.albums.items.length + " albums.");

                        data.albums.items.forEach((e) => {
                            const COVER = e.cover ? e.cover : undefined;

                            result.albums.push(
                                {
                                    name: e.title,
                                    source: "tidal",
                                    identifier: "" + e.id,
                                    coverUrl: COVER ? (TIDAL_RESOURCES_URL + "images/" + COVER.replaceAll('-', '/') + "/1280x1280.jpg") : undefined,
                                    songsNumber: e.numberOfTracks + e.numberOfVideos,
                                    duration: e.duration,
                                    artist: e.artists[0].name,
                                }
                            );
                        });
                    } else
                        console.log("Tidal: no artists for query");

                    res(result);
                });
            } catch (e) {
                rej("API call failed: " + e);
            }
        }
    );
}

async function login(): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            const TOKEN = getToken();

            if (TOKEN == "") {
                res(false);
                return;
            }

            try {
                console.log("Tidal: Logging in");

                const response =
                    await fetch(
                        TIDAL_URL + TIDAL_SESSION_API_ENDPOINT,
                        {
                            method: 'GET',
                            headers: {
                                "Accept": "*/*",
                                "authorization": "Bearer " + TOKEN,
                                "Host": "listen.tidal.com"
                            }
                        }
                    );

                response.json().then((data) => {
                    if (data.code != 200) {
                        console.log("Tidal login failed, got code " + data.status + ": " + data.statusText);
                        res(false);
                        return;
                    }

                    if (!data.sessionId || !data.countryCode) {
                        res(false);
                        return;
                    }

                    TIDAL_COUNTRY_CODE = data.countryCode;
                    TIDAL_SESSION_ID = data.sessionId;

                    console.log("Got tidal session for country " + TIDAL_COUNTRY_CODE);

                    res(true);
                }).catch((e) => {
                    console.error("Tidal didn't log in");
                    console.error(e);
                })


            } catch (e) {
                res(false);
            }
        }
    )
}

async function play(identifier: string) {
    return new Promise<boolean>(async (res, rej) => {
        const TOKEN = getToken();

        if (TOKEN == "") {
            rej("No Tidal token configured");
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        try {
            const response =
                await fetch(
                    TIDAL_URL + TIDAL_TRACK_API_ENDPOINT + identifier + TIDAL_PLAYBACKINFO_ENDPOINT_AFTER + "?audioquality=LOSSLESS&playbackmode=STREAM&assetpresentation=FULL",
                    {
                        method: 'GET',
                        headers: {
                            "Accept": "application/json",
                            "authorization": "Bearer " + TOKEN,
                            "Host": "listen.tidal.com"
                        }
                    }
                );

            response.json().then(async (data) => {
                // we got audio presentation data. We need some tokens
                const licenseSecurityToken = data.licenseSecurityToken;
                const manifestBase64 = data.manifest;
                const trackId = data.trackId;

                console.log("Tidal returned " + Math.floor(parseInt(data.sampleRate) / 100) / 10 + "kHz " + data.bitDepth + "b stream data.");

                mainWindow.webContents.send('playTidal', {
                    manifest: manifestBase64,
                    licenseToken: licenseSecurityToken,
                    sessionId: TIDAL_SESSION_ID,
                    token: TOKEN
                });

                // gather album and track data separately
                const response2 = await fetch(
                    TIDAL_URL + TIDAL_TRACK_API_ENDPOINT + trackId + "?countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US",
                    {
                        method: 'GET',
                        headers: {
                            "Accept": "application/json",
                            "authorization": "Bearer " + TOKEN,
                            "Host": "listen.tidal.com"
                        }
                    }
                );

                response2.json().then((data2) => {
                    if (data2.album && data2.album.cover) {
                        playbackData.albumCover = (TIDAL_RESOURCES_URL + "images/" + data2.album.cover.replaceAll('-', '/') + "/1280x1280.jpg");
                        playbackData.albumCoverUpdated = true;
                    } else {
                        console.log("Tidal backend: No cover for album?");
                        playbackData.albumCover = "";
                    }

                    playbackData.playing = true;
                    playbackData.quality = "Tidal Lossless";
                    playbackData.album = data2.album ? data2.album.title : "unknown";
                    playbackData.artist = data2.artist ? data2.artist.name : data2.artists[0].name;
                    playbackData.identifier = identifier;
                    playbackData.source = "tidal";
                    playbackData.totalSeconds = data2.duration;
                    playbackData.title = data2.title;

                    res(true);
                }).catch((e) => {
                    console.log(e);
                    res(false);
                });
            }).catch((e) => {
                console.log(e);
                res(false);
            })
        } catch (e) {
            rej("API call failed: " + e);
        }
    });
}

async function seek(seconds: number) {
    return new Promise<boolean>(
        async (res) => {
            mainWindow.webContents.send('tidalPlayEvent', {
                seek: seconds,
            });
            res(true);
        }
    );
}

async function setVolume(vol: number) {
    return new Promise<boolean>(
        async (res) => {
            mainWindow.webContents.send('tidalPlayEvent', {
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
            mainWindow.webContents.send('tidalPlayEvent', {
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
            source: "tidal",
            title: "Unknown title",
            artist: "",
            album: "",
            duration: 0,
        };

        const TOKEN = getToken();

        if (TOKEN == "") {
            res(sd);
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        const response2 = await fetch(
            TIDAL_URL + TIDAL_TRACK_API_ENDPOINT + identifier + "?countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US",
            {
                method: 'GET',
                headers: {
                    "Accept": "application/json",
                    "authorization": "Bearer " + TOKEN,
                    "Host": "listen.tidal.com"
                }
            }
        );

        response2.json().then((data2) => {
            sd.album = data2.album ? data2.album.title : "unknown";
            sd.artist = data2.artist ? data2.artist.name : data2.artists[0].name;
            sd.duration = data2.duration;
            sd.title = data2.title;
            sd.albumId = data2.album ? "" + data2.id : undefined;
            sd.artistId = data2.artist ? "" + data2.artist.id : "" + data2.artists[0].id;

            res(sd);
        }).catch((e) => {
            console.log(e);
            res(sd);
        })
    });
}

async function getPlaylistData(data: PlaylistDataShort): Promise<PlaylistData> {
    return new Promise<PlaylistData>(async (res) => {
        const TOKEN = getToken();

        let pd: PlaylistData = {
            name: data.name,
            songs: [],
            source: "tidal",
            identifier: data.identifier
        };

        if (TOKEN == "") {
            res(pd);
            return;
        }

        console.log("Requesting data for playlist " + data.name + " with uuid of " + data.identifier + ".");

        let loaded = 0;

        console.log("Playlist " + data.name + " has " + data.songsNumber + " items.");

        async function getChunk(): Promise<void> {
            return new Promise<void>((res) => {
                const response2 = fetch(
                    TIDAL_URL + TIDAL_PLAYLISTS_API_ENDPOINT + "/" + data.identifier + "/items?offset=" + loaded + "&limit=50&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US",
                    {
                        method: 'GET',
                        headers: {
                            "Accept": "application/json",
                            "authorization": "Bearer " + TOKEN,
                            "Host": "listen.tidal.com"
                        }
                    }
                );

                response2.then((x) => {
                    x.json().then((itemJson) => {
                        if (!itemJson.items)
                            return;

                        let i = 0;

                        itemJson.items.forEach((song) => {
                            pd.songs.push(
                                {
                                    title: song.item.title,
                                    identifier: "" + song.item.id,
                                    source: "tidal",
                                    duration: song.item.duration,
                                    album: song.item.album ? song.item.album.title : "unknown",
                                    artist: song.item.artist ? song.item.artist.name : song.item.artists[0].name,
                                    albumCoverUrl: song.item.album ? TIDAL_RESOURCES_URL + "images/" + song.item.album.cover.replaceAll('-', '/') + "/1280x1280.jpg" : undefined,
                                    playlist: "tidal_" + data.identifier,
                                    index: i,
                                }
                            )

                            i++;
                        });

                        loaded += 50;
                        res();
                    });
                }).catch((e) => {
                    console.error("Tidal said no:");
                    console.error(e);
                });
            });
        }

        while (loaded < data.songsNumber) {
            await getChunk();
        }

        res(pd);
    });
}

async function getPlaylists(): Promise<Array<PlaylistDataShort>> {
    return new Promise<Array<PlaylistDataShort>>(async (res) => {
        let pd: Array<PlaylistDataShort> = [];

        const TOKEN = getToken();

        if (TOKEN == "") {
            res(pd);
            return;
        }

        const response = await fetch(
            TIDAL_URL + TIDAL_FOLDERS_API_ENDPOINT + "?folderId=root&includeOnly=PLAYLIST&offset=0&limit=50&order=DATE&orderDirection=DESC&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US",
            {
                method: 'GET',
                headers: {
                    "Accept": "application/json",
                    "authorization": "Bearer " + TOKEN,
                    "Host": "listen.tidal.com"
                }
            }
        );

        response.json().then((json) => {

            if (!json.items) {
                res(pd);
                return;
            }

            console.log("Tidal returned " + json.items.length + " playlists.");

            json.items.forEach((item) => {
                let data: PlaylistDataShort = {
                    name: item.name,
                    identifier: item.data.uuid,
                    duration: item.data.duration,
                    source: "tidal",
                    songsNumber: item.data.numberOfTracks + item.data.numberOfVideos,
                }

                pd.push(data);
            });

            res(pd);
        });
    });
}

async function getArtistData(identifier: string): Promise<ArtistData> {
    return new Promise<ArtistData>(async (res) => {
        let result: ArtistData = {
            name: "",
            topSongs: [],
            identifier: identifier,
            source: "tidal",
            relatedArtists: [],
            newAlbums: [],
        };

        const TOKEN = getToken();

        if (TOKEN == "") {
            res(result);
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        const response =
            await fetch(
                TIDAL_URL + TIDAL_ARTIST_API_ENDPOINT + "?artistId=" + identifier + "&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&deviceType=BROWSER",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "authorization": "Bearer " + TOKEN,
                        "Host": "listen.tidal.com"
                    }
                }
            );

        response.json().then((data) => {
            if (!data.rows) {
                console.log("Tidal: artist query error");
                console.log(data);
                res(result);
                return;
            }

            result.name = data.title;

            data.rows.forEach((e) => {
                if (!e.modules)
                    return;

                if (e.modules[0].type == "ARTIST_HEADER") {
                    const PICTURE = e.modules[0].artist.picture ? e.modules[0].artist.picture : e.modules[0].artist.selectedAlbumCoverFallback;
                    result.imageURL = PICTURE ? TIDAL_RESOURCES_URL + "images/" + PICTURE.replaceAll('-', '/') + "/1280x1280.jpg" : undefined
                    return;
                }

                if (e.modules[0].type == "TRACK_LIST") {
                    e.modules[0].pagedList.items.forEach((song) => {
                        result.topSongs.push(
                            {
                                title: song.title,
                                identifier: "" + song.id,
                                source: "tidal",
                                duration: song.duration,
                                album: song.album ? song.album.title : "unknown",
                                albumId: song.album ? song.album.id + "" : undefined,
                                artist: song.artist ? song.artist.name : song.artists[0].name,
                                artistId: song.artist ? "" + song.artist.id : song.artists[0].id + "",
                                albumCoverUrl: song.album ? TIDAL_RESOURCES_URL + "images/" + song.album.cover.replaceAll('-', '/') + "/1280x1280.jpg" : undefined,
                            }
                        );
                    });

                    return;
                }

                if (e.modules[0].type == "ARTIST_LIST") {
                    e.modules[0].pagedList.items.forEach((artist) => {

                        const COVER = artist.picture ? artist.picture : (artist.selectedAlbumCoverFallback ? artist.selectedAlbumCoverFallback : undefined);

                        result.relatedArtists.push(
                            {
                                name: artist.name,
                                identifier: "" + artist.id,
                                source: "tidal",
                                topSongs: [],
                                relatedArtists: [],
                                newAlbums: [],
                                imageURL: COVER ? TIDAL_RESOURCES_URL + "images/" + COVER.replaceAll('-', '/') + "/1280x1280.jpg" : undefined,
                            }
                        );
                    });

                    return;
                }

                if (e.modules[0].type == "ALBUM_LIST" && e.modules[0].title == "Albums") {
                    e.modules[0].pagedList.items.forEach((album) => {

                        result.newAlbums.push(
                            {
                                name: album.title,
                                identifier: "" + album.id,
                                source: "tidal",
                                songsNumber: album.numberOfTracks + album.numberOfVideos,
                                duration: album.duration,
                                coverUrl: album.cover ? TIDAL_RESOURCES_URL + "images/" + album.cover.replaceAll('-', '/') + "/1280x1280.jpg" : undefined,
                                year: album.releaseDate ? (album.releaseDate.indexOf('-') != -1 ? album.releaseDate.substring(0, album.releaseDate.indexOf('-')) : album.releaseDate) : undefined,
                                artist: album.artists[0].name,
                            }
                        );
                    });

                    return;
                }
            });

            res(result);
        });
    });
}

async function getAlbumData(identifier: string): Promise<AlbumData> {
    return new Promise<AlbumData>(async (res) => {
        let result: AlbumData = {
            name: "",
            artist: "",
            songs: [],
            identifier: identifier,
            source: "tidal",
        };

        const TOKEN = getToken();

        if (TOKEN == "") {
            res(result);
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        let artistId: string = "";

        const response =
            await fetch(
                TIDAL_URL + TIDAL_ALBUM_API_ENDPOINT + "?albumId=" + identifier + "&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&deviceType=BROWSER",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "authorization": "Bearer " + TOKEN,
                        "Host": "listen.tidal.com"
                    }
                }
            );

        response.json().then((data) => {
            if (!data.rows) {
                console.log("Tidal: artist query error");
                console.log(data);
                res(result);
                return;
            }

            result.name = data.title;

            data.rows.forEach((e) => {
                if (!e.modules)
                    return;


                if (e.modules[0].type == "ALBUM_HEADER") {
                    result.coverUrl = e.modules[0].album.cover ? TIDAL_RESOURCES_URL + "images/" + e.modules[0].album.cover.replaceAll('-', '/') + "/1280x1280.jpg" : undefined
                    result.artist = e.modules[0].album.artists[0].name;
                    artistId = e.modules[0].album.artists[0].id + "";
                    result.year = e.modules[0].album.releaseDate ? (e.modules[0].album.releaseDate.indexOf('-') != -1 ? e.modules[0].album.releaseDate.substring(0, e.modules[0].album.releaseDate.indexOf('-')) : e.modules[0].album.releaseDate) : undefined;
                    return;
                }

                if (e.modules[0].type == "ALBUM_ITEMS") {
                    e.modules[0].pagedList.items.forEach((song) => {
                        result.songs.push(
                            {
                                title: song.item.title,
                                identifier: "" + song.item.id,
                                source: "tidal",
                                duration: song.item.duration,
                                // HEADER is always first so we know these are good
                                album: result.name,
                                artist: result.artist,
                                artistId: artistId,
                                albumCoverUrl: result.coverUrl,
                            }
                        );
                    });

                    return;
                }
            });

            res(result);
        });
    });
}

export default {
    performSearch,
    play,
    login,
    seek,
    setVolume,
    getPlayState,
    pausePlay,
    elapsed,
    songFromID,
    getPlaylists,
    getPlaylistData,
    getArtistData,
    getAlbumData,
}