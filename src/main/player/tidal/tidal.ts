import { mainWindow } from "../..";
import config from "../../config/config";
import { PlaylistDataShort } from "../../types/playlistDataShort";
import { PlaylistData } from "../../types/playlistData";
import { SongDataShort } from "../../types/songData";
import { SongInfo } from "../../types/songInfo";
import { SearchResults } from "../../types/searchResults";
import { ArtistData } from "../../types/artistData";
import { AlbumData } from "../../types/albumData";
import helpers from "../../helpers/helpers";
import { ArtistDataShort } from "../../types/artistDataShort";
import { LyricData } from "../../types/lyricData";

function getToken() {
    return config.getConfigValue("tidalToken");
}

const TIDAL_URL = "https://listen.tidal.com/";
const TIDAL_AUTH_URL = "https://auth.tidal.com/";
const TIDAL_AUTH_TOKEN_API_ENDPOINT = "v1/oauth2/token";
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
let TIDAL_LOGGED_IN = false;
let TIDAL_SESSION_TOKEN = "";

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
    source: "tidal",
    volume: -1,
    lyrics: undefined,
};

async function performSearch(searchFor: string): Promise<SearchResults> {
    return new Promise<SearchResults>(
        async (res, rej) => {
            if (!TIDAL_LOGGED_IN) {
                rej("Tidal: not logged in");
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
                                "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                                "Host": "listen.tidal.com"
                            }
                        }
                    );

                response.json().then((data) => {
                    if (data.tracks.items.length != 0) {
                        console.log("Tidal returned " + data.tracks.items.length + " tracks.");

                        data.tracks.items.forEach((e) => {
                            let artists: Array<ArtistDataShort> = [];
                            let artistString = "";
                            e.artists.forEach((x) => {
                                artistString += x.name + ", ";
                                artists.push({
                                    name: x.name,
                                    identifier: "" + x.id,
                                    source: "tidal",
                                })
                            });

                            result.songs.push(
                                {
                                    title: e.title,
                                    album: e.album ? e.album.title : "unknown",
                                    albumId: e.album ? "" + e.album.id : undefined,
                                    duration: e.duration,
                                    artistString: artistString.substring(0, artistString.length - 2),
                                    artists: artists,
                                    source: "tidal",
                                    identifier: "" + e.id,
                                    albumCoverUrl: e.album && e.album.cover ? (TIDAL_RESOURCES_URL + "images/" + e.album.cover.replaceAll('-', '/') + "/750x750.jpg") : undefined,
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
                                    imageURL: COVER ? (TIDAL_RESOURCES_URL + "images/" + COVER.replaceAll('-', '/') + "/750x750.jpg") : undefined,
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

                            let artists: Array<ArtistDataShort> = [];
                            let artistString = "";
                            e.artists.forEach((x) => {
                                artistString += x.name + ", ";
                                artists.push({
                                    name: x.name,
                                    identifier: "" + x.id,
                                    source: "tidal",
                                })
                            });

                            result.albums.push(
                                {
                                    name: e.title,
                                    source: "tidal",
                                    identifier: "" + e.id,
                                    coverUrl: COVER ? (TIDAL_RESOURCES_URL + "images/" + COVER.replaceAll('-', '/') + "/750x750.jpg") : undefined,
                                    songsNumber: e.numberOfTracks + e.numberOfVideos,
                                    duration: e.duration,
                                    artistString: artistString.substring(0, artistString.length - 2),
                                    artists: artists,
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

async function refreshToken(): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            if (config.getConfigValue("tidalClientID") == "" || config.getConfigValue("tidalRefreshToken") == "") {
                res(false);
                return;
            }

            let CID = config.getConfigValue("tidalClientID");
            let TK = config.getConfigValue("tidalRefreshToken");

            CID = CID.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');
            TK = TK.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');

            const response =
                await fetch(
                    TIDAL_AUTH_URL + TIDAL_AUTH_TOKEN_API_ENDPOINT,
                    {
                        method: 'POST',
                        headers: {
                            "Accept": "*/*",
                            "Host": "auth.tidal.com",
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        },
                        body: "client_id=" + CID + "&grant_type=refresh_token&refresh_token=" + TK + "&scope=r_usr+w_usr",
                    }
                );

            response.json().then((data) => {
                if (response.status != 200) {
                    console.log("Tidal: refresh token failed: " + response.status + ": " + response.statusText);
                    res(false);
                    return;
                }

                if (data.access_token) {
                    console.log("Tidal: got explicit new token from oauth endpoint, updating config");
                    config.setConfigValue("tidalToken", data.access_token);
                    TIDAL_SESSION_TOKEN = data.access_token;
                    res(true);
                    return;
                }

                // FIXME: these tokens are valid for 24h. If we have the player open for more, it will expire.

                console.log("Tidal: Got an empty response from oauth2. Likely auth'd already.");
                TIDAL_SESSION_TOKEN = data.config.getConfigValue("tidalToken");
                res(true);
                return;
            });
        }
    )
}

async function login(): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            const SUCCESS = await refreshToken();
            if (!SUCCESS) {
                console.log("Tidal: Can't log in, refreshing token failed");
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
                                "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                                "Host": "listen.tidal.com"
                            }
                        }
                    );

                response.json().then((data) => {
                    if (response.status != 200) {
                        console.log("Tidal login failed, got code " + response.status + ": " + response.statusText);
                        res(false);
                        return;
                    }

                    if (!data.sessionId || !data.countryCode) {
                        console.log("Tidal login failed, got a weird response");
                        res(false);
                        return;
                    }

                    TIDAL_COUNTRY_CODE = data.countryCode;
                    TIDAL_SESSION_ID = data.sessionId;

                    console.log("Got tidal session for country " + TIDAL_COUNTRY_CODE);

                    TIDAL_LOGGED_IN = true;

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
        if (!TIDAL_LOGGED_IN) {
            rej("Tidal: not logged in");
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        playbackData.lyrics = undefined;
        playbackData.lyricsUpdated = true;

        try {
            const response =
                await fetch(
                    TIDAL_URL + TIDAL_TRACK_API_ENDPOINT + identifier + TIDAL_PLAYBACKINFO_ENDPOINT_AFTER + "?audioquality=LOSSLESS&playbackmode=STREAM&assetpresentation=FULL",
                    {
                        method: 'GET',
                        headers: {
                            "Accept": "application/json",
                            "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
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
                    token: TIDAL_SESSION_TOKEN
                });

                // gather album and track data separately
                const response2 = await fetch(
                    TIDAL_URL + TIDAL_TRACK_API_ENDPOINT + trackId + "?countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US",
                    {
                        method: 'GET',
                        headers: {
                            "Accept": "application/json",
                            "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                            "Host": "listen.tidal.com"
                        }
                    }
                );

                response2.json().then((data2) => {
                    if (data2.album) {
                        if (data2.album.cover)
                            playbackData.albumCover = (TIDAL_RESOURCES_URL + "images/" + data2.album.cover.replaceAll('-', '/') + "/750x750.jpg");
                        if (data2.album.videoCover)
                            playbackData.albumVideoCover = (TIDAL_RESOURCES_URL + "videos/" + data2.album.videoCover.replaceAll('-', '/') + "/750x750.mp4");
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

                    getLyrics(identifier).then((l: LyricData) => {
                        playbackData.lyrics = l;
                        playbackData.lyricsUpdated = true;
                    }).catch((e) => {
                        console.log("Tidal: track " + identifier + " has no lyrics");
                    });

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
            playbackData.lyricsUpdated = false;
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
            artistString: "",
            album: "",
            duration: 0,
        };

        if (!TIDAL_LOGGED_IN) {
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
                    "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                    "Host": "listen.tidal.com"
                }
            }
        );

        response2.json().then((data2) => {
            let artists: Array<ArtistDataShort> = [];
            let artistString = "";
            data2.artists.forEach((x) => {
                artistString += x.name + ", ";
                artists.push({
                    name: x.name,
                    identifier: "" + x.id,
                    source: "tidal",
                })
            });

            sd.album = data2.album ? data2.album.title : "unknown";
            sd.duration = data2.duration;
            sd.title = data2.title;
            sd.albumId = data2.album ? "" + data2.id : undefined;
            sd.artistString = artistString.substring(0, artistString.length - 2);
            sd.artists = artists;

            res(sd);
        }).catch((e) => {
            console.log(e);
            res(sd);
        })
    });
}

async function getPlaylistData(data: PlaylistDataShort): Promise<PlaylistData> {
    return new Promise<PlaylistData>(async (res) => {
        let pd: PlaylistData = {
            name: data.name,
            songs: [],
            source: "tidal",
            identifier: data.identifier
        };

        if (!TIDAL_LOGGED_IN) {
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
                            "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                            "Host": "listen.tidal.com"
                        }
                    }
                );

                response2.then((x) => {

                    if (x.headers.has("etag"))
                        pd.etag = x.headers.get("etag");

                    x.json().then((itemJson) => {
                        if (!itemJson.items)
                            return;

                        let i = 0;

                        itemJson.items.forEach((song) => {
                            let artists: Array<ArtistDataShort> = [];
                            let artistString = "";
                            song.item.artists.forEach((x) => {
                                artistString += x.name + ", ";
                                artists.push({
                                    name: x.name,
                                    identifier: "" + x.id,
                                    source: "tidal",
                                })
                            });

                            pd.songs.push(
                                {
                                    title: song.item.title,
                                    identifier: "" + song.item.id,
                                    source: "tidal",
                                    duration: song.item.duration,
                                    album: song.item.album ? song.item.album.title : "unknown",
                                    albumId: song.item.album ? "" + song.item.album.id : undefined,
                                    artists: artists,
                                    artistString: artistString.substring(0, artistString.length - 2),
                                    albumCoverUrl: song.item.album && song.item.album.cover ? TIDAL_RESOURCES_URL + "images/" + song.item.album.cover.replaceAll('-', '/') + "/750x750.jpg" : undefined,
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
    return new Promise<Array<PlaylistDataShort>>(async (res, rej) => {
        let pd: Array<PlaylistDataShort> = [];

        if (!TIDAL_LOGGED_IN) {
            rej();
            return;
        }

        const response = await fetch(
            TIDAL_URL + TIDAL_FOLDERS_API_ENDPOINT + "?folderId=root&includeOnly=PLAYLIST&offset=0&limit=50&order=DATE&orderDirection=DESC&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US",
            {
                method: 'GET',
                headers: {
                    "Accept": "application/json",
                    "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
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
    return new Promise<ArtistData>(async (res, rej) => {
        let result: ArtistData = {
            name: "",
            topSongs: [],
            identifier: identifier,
            source: "tidal",
            relatedArtists: [],
            newAlbums: [],
        };

        if (!TIDAL_LOGGED_IN) {
            rej("Not logged in");
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
                        "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                        "Host": "listen.tidal.com"
                    }
                }
            );

        response.json().then((data) => {
            if (!data.rows) {
                console.log("Tidal: artist query error");
                console.log(data);
                rej("artist query server error");
                return;
            }

            result.name = data.title;

            data.rows.forEach((e) => {
                if (!e.modules)
                    return;

                if (e.modules[0].type == "ARTIST_HEADER") {
                    const PICTURE = e.modules[0].artist.picture ? e.modules[0].artist.picture : e.modules[0].artist.selectedAlbumCoverFallback;
                    result.imageURL = PICTURE ? TIDAL_RESOURCES_URL + "images/" + PICTURE.replaceAll('-', '/') + "/750x750.jpg" : undefined
                    return;
                }

                if (e.modules[0].type == "TRACK_LIST") {
                    e.modules[0].pagedList.items.forEach((song) => {
                        let artists: Array<ArtistDataShort> = [];
                        let artistString = "";
                        song.artists.forEach((x) => {
                            artistString += x.name + ", ";
                            artists.push({
                                name: x.name,
                                identifier: "" + x.id,
                                source: "tidal",
                            })
                        });

                        result.topSongs.push(
                            {
                                title: song.title,
                                identifier: "" + song.id,
                                source: "tidal",
                                duration: song.duration,
                                album: song.album ? song.album.title : "unknown",
                                albumId: song.album ? song.album.id + "" : undefined,
                                artists: artists,
                                artistString: artistString.substring(0, artistString.length - 2),
                                albumCoverUrl: song.album ? TIDAL_RESOURCES_URL + "images/" + song.album.cover.replaceAll('-', '/') + "/750x750.jpg" : undefined,
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
                                imageURL: COVER ? TIDAL_RESOURCES_URL + "images/" + COVER.replaceAll('-', '/') + "/750x750.jpg" : undefined,
                            }
                        );
                    });

                    return;
                }

                if (e.modules[0].type == "ALBUM_LIST" && e.modules[0].title == "Albums") {
                    e.modules[0].pagedList.items.forEach((album) => {

                        let artists: Array<ArtistDataShort> = [];
                        let artistString = "";
                        album.artists.forEach((x) => {
                            artistString += x.name + ", ";
                            artists.push({
                                name: x.name,
                                identifier: "" + x.id,
                                source: "tidal",
                            })
                        });

                        result.newAlbums.push(
                            {
                                name: album.title,
                                identifier: "" + album.id,
                                source: "tidal",
                                songsNumber: album.numberOfTracks + album.numberOfVideos,
                                duration: album.duration,
                                coverUrl: album.cover ? TIDAL_RESOURCES_URL + "images/" + album.cover.replaceAll('-', '/') + "/750x750.jpg" : undefined,
                                year: album.releaseDate ? (album.releaseDate.indexOf('-') != -1 ? album.releaseDate.substring(0, album.releaseDate.indexOf('-')) : album.releaseDate) : undefined,
                                artists: artists,
                                artistString: artistString.substring(0, artistString.length - 2),
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
    return new Promise<AlbumData>(async (res, rej) => {
        let result: AlbumData = {
            name: "",
            artist: "",
            songs: [],
            identifier: identifier,
            source: "tidal",
        };

        if (!TIDAL_LOGGED_IN) {
            rej("Not logged in");
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        const response =
            await fetch(
                TIDAL_URL + TIDAL_ALBUM_API_ENDPOINT + "?albumId=" + identifier + "&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&deviceType=BROWSER",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                        "Host": "listen.tidal.com"
                    }
                }
            );

        response.json().then((data) => {
            if (!data.rows) {
                console.log("Tidal: artist query error");
                console.log(data);
                rej("Server error");
                return;
            }

            result.name = data.title;

            data.rows.forEach((e) => {
                if (!e.modules)
                    return;


                if (e.modules[0].type == "ALBUM_HEADER") {
                    result.coverUrl = e.modules[0].album.cover ? TIDAL_RESOURCES_URL + "images/" + e.modules[0].album.cover.replaceAll('-', '/') + "/750x750.jpg" : undefined
                    result.coverVideoUrl = e.modules[0].album.videoCover ? TIDAL_RESOURCES_URL + "videos/" + e.modules[0].album.videoCover.replaceAll('-', '/') + "/750x750.mp4" : undefined
                    // FIXME: allow passing multiple artists properly
                    let artists = "";
                    e.modules[0].album.artists.forEach((x) => {
                        artists += x.name + ", ";
                    });

                    result.artist = artists.substring(0, artists.length - 2);
                    // artistId = e.modules[0].album.artists[0].id + "";

                    if (e.modules[0].album.releaseDate) {
                        const SPLIT = e.modules[0].album.releaseDate.split('-');
                        result.year = SPLIT[0];

                        if (SPLIT.length == 3)
                            result.date = helpers.prettyDate(SPLIT);
                    }

                    if (e.modules[0].album.copyright)
                        result.copyright = e.modules[0].album.copyright;
                    return;
                }

                if (e.modules[0].type == "ALBUM_ITEMS") {
                    e.modules[0].pagedList.items.forEach((song) => {
                        let artists: Array<ArtistDataShort> = [];
                        let artistString = "";
                        song.item.artists.forEach((x) => {
                            artistString += x.name + ", ";
                            artists.push({
                                name: x.name,
                                identifier: "" + x.id,
                                source: "tidal",
                            })
                        });

                        result.songs.push(
                            {
                                title: song.item.title,
                                identifier: "" + song.item.id,
                                source: "tidal",
                                duration: song.item.duration,
                                artistString: artistString.substring(0, artistString.length - 2),
                                artists: artists,
                                // HEADER is always first so we know these are good
                                album: result.name,
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

async function getLyrics(identifier: string): Promise<LyricData> {
    return new Promise<LyricData>(async (res, rej) => {

        let lyrics: LyricData = {
            lyrics: [],
            rawLyrics: [],
        };

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 ]/g, '');

        const response =
            await fetch(
                TIDAL_URL + TIDAL_TRACK_API_ENDPOINT + identifier + "/lyrics?countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&deviceType=BROWSER",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                        "Host": "listen.tidal.com"
                    }
                }
            );

        response.json().then((data) => {
            if (!data.lyrics) {
                rej("no lyrics");
                return;
            }

            lyrics.rawLyrics = data.lyrics.split("\n");

            if (!data.subtitles) {
                res(lyrics);
                return;
            }

            data.subtitles.split('\n').forEach((line) => {
                // [mm:ss.ds] lyric...
                if (line.indexOf("]") == -1)
                    return;
                const text = line.substring(line.indexOf("]") + 2);
                const time = line.substring(1, line.indexOf("]"));

                const mins = parseInt(time.substring(0, time.indexOf(":")));
                const secs = parseInt(time.substring(time.indexOf(":") + 1, time.indexOf(".")));
                const ds = parseInt(time.substring(time.indexOf(".") + 1));

                lyrics.lyrics.push({
                    timeMs: mins * 60 * 1000 + secs * 1000 + ds * 10,
                    lyric: text
                });
            });

            res(lyrics);
        }).catch((e) => {
            console.log(e);
            rej("error in request");
        });
    });
}

async function removeFromPlaylist(song: SongDataShort, playlist: PlaylistDataShort): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            if (!(song.index >= 0)) {
                console.log("tidal: removeFromPlaylist: invalid idx");
                res(false);
            }

            getPlaylistData(playlist).then(async (x) => {
                if (x.etag == null) {
                    console.log("playlist: no etag");
                    res(false);
                    return;
                }

                const response =
                    await fetch(
                        TIDAL_URL + TIDAL_PLAYLISTS_API_ENDPOINT + "/" + playlist.identifier + "/items/" + song.index + "?order=INDEX&orderDirection=ASC&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&deviceType=BROWSER",
                        {
                            method: 'DELETE',
                            headers: {
                                "Accept": "*/*",
                                "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                                "Host": "listen.tidal.com",
                                "if-none-match": "" + x.etag,
                            }
                        }
                    );

                res(true);
            }).catch((e) => {
                console.log(e);
                res(false);
            });
        }
    )
}

async function addToPlaylist(song: SongDataShort, playlist: PlaylistDataShort): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            getPlaylistData(playlist).then(async (x) => {
                if (x.etag == null) {
                    console.log("playlist: no etag");
                    res(false);
                    return;
                }

                const bodey = new URLSearchParams();
                bodey.append("onArtifactNotFound", "FAIL");
                bodey.append("onDupes", "FAIL");
                bodey.append("trackIds", "" + song.identifier);

                const response =
                    await fetch(
                        TIDAL_URL + TIDAL_PLAYLISTS_API_ENDPOINT + "/" + playlist.identifier + "/items?countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&deviceType=BROWSER",
                        {
                            method: 'POST',
                            headers: {
                                "Accept": "*/*",
                                "authorization": "Bearer " + TIDAL_SESSION_TOKEN,
                                "Host": "listen.tidal.com",
                                "if-none-match": x.etag,
                            },
                            body: bodey,
                        }
                    );

                response.json().then((data) => {
                    console.log(data);
                    res(true);
                }).catch((e) => {
                    console.log(e);
                    res(false);
                });
            }).catch(e => {
                console.log(e);
                res(false);
            });
        }
    )
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
    getLyrics,
    removeFromPlaylist,
    addToPlaylist,
}