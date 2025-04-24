import { BrowserWindow } from "electron";
import config from "../../config/config";
import oauth from "../../oauth/oauth";
import { SearchResults } from "../../types/searchResults";
import { SongDataShort } from "../../types/songData";
import { ArtistDataShort } from "../../types/artistDataShort";
import { ArtistData } from "../../types/artistData";
import { AlbumDataShort } from "../../types/albumDataShort";
import { SongInfo } from "../../types/songInfo";
import { mainWindow } from "../..";
import { AlbumData } from "../../types/albumData";
import { PlaylistDataShort } from "../../types/playlistDataShort";
import { PlaylistData } from "../../types/playlistData";

const SPOTIFY_ACCOUNTS_URL = "https://accounts.spotify.com/";
const SPOTIFY_API_URL = "https://api.spotify.com/";

let SPOTIFY_SESSION_TOKEN: string = "";
let SPOTIFY_LOGGED_IN: boolean = false;
let SPOTIFY_DEVICE_ID: string = "";
let SPOTIFY_USER_ID: string = "";

// With spotify, we get elapsed fed from the render thread
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
};

async function refreshToken(): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            if (config.getConfigValue("spotifyClientID") == "" || config.getConfigValue("spotifyRefreshToken") == "") {
                res(false);
                return;
            }

            let CID = config.getConfigValue("spotifyClientID");
            let TK = config.getConfigValue("spotifyRefreshToken");

            CID = CID.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');
            TK = TK.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');

            const response =
                await fetch(
                    SPOTIFY_ACCOUNTS_URL + "api/token",
                    {
                        method: 'POST',
                        headers: {
                            "Accept": "*/*",
                            "Host": "auth.tidal.com",
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        },
                        body: "client_id=" + CID + "&grant_type=refresh_token&refresh_token=" + TK,
                    }
                );

            response.json().then((data) => {
                if (response.status != 200) {
                    console.log(data);
                    console.log("Spotify: refresh token failed: " + response.status + ": " + response.statusText);
                    res(false);
                    return;
                }

                if (data.access_token) {
                    console.log("Spotify: got explicit new token from oauth endpoint, updating config");
                    config.setConfigValue("spotifyToken", data.access_token);
                    SPOTIFY_SESSION_TOKEN = data.access_token;
                    config.setConfigValue("spotifyRefreshToken", data.refresh_token);
                    res(true);
                    return;
                }

                // FIXME: these tokens are valid for 24h. If we have the player open for more, it will expire.

                console.log("Spotify: Got an empty response from oauth2. Likely auth'd already.");
                SPOTIFY_SESSION_TOKEN = data.config.getConfigValue("spotifyToken");
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
                console.log("Spotify: Can't log in, refreshing token failed");
                return;
            }

            try {
                console.log("Spotify: Logging in");

                const response =
                    await fetch(
                        SPOTIFY_API_URL + "v1/me",
                        {
                            method: 'GET',
                            headers: {
                                "Accept": "*/*",
                                "authorization": "Bearer " + SPOTIFY_SESSION_TOKEN
                            }
                        }
                    );

                response.json().then((data) => {

                    if (response.status != 200) {
                        console.log("Spotify login failed, got code " + response.status + ": " + response.statusText);
                        res(false);
                        return;
                    }

                    if (!data.display_name) {
                        console.log("Spotify login failed, got a weird response");
                        res(false);
                        return;
                    }

                    SPOTIFY_USER_ID = data.id;

                    console.log("Got spotify session for user " + data.display_name);

                    SPOTIFY_LOGGED_IN = true;

                    res(true);
                }).catch((e) => {
                    console.error("Spotify didn't log in");
                    console.error(e);
                });
            } catch (e) {
                res(false);
            }
        }
    )
}

async function attemptNewSession(): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            if (config.getConfigValue("spotifyClientID") == "") {
                res(false);
                return;
            }

            const CID = config.getConfigValue("spotifyClientID");

            var oauthWindow = new BrowserWindow({
                width: 800,
                height: 600,
                show: true,
            });

            const VERIFIER = oauth.randomString(64);
            const CHALLENGE = oauth.B64Encode(await oauth.sha256(VERIFIER));
            const STATE = oauth.randomString(32);

            const SCOPES = "streaming%20playlist-read-private%20playlist-read-collaborative%20playlist-modify-private%20playlist-modify-public%20user-follow-modify%20user-follow-read%20user-top-read%20user-read-recently-played%20user-library-modify%20user-library-read";

            oauthWindow.loadURL(SPOTIFY_ACCOUNTS_URL + "authorize?response_type=code&client_id=" + CID +
                "&redirect_uri=https://spotify.com/nonexistent-vermilion&scope=" + SCOPES + "&code_challenge_method=S256&code_challenge=" + CHALLENGE + "&state=" + STATE);

            oauthWindow.webContents.on('will-redirect', async function (e) {
                const redirect = e.url;
                if (redirect.indexOf("https://spotify.com/nonexistent-vermilion") == -1 && redirect.indexOf("https://www.spotify.com/nonexistent-vermilion") == -1)
                    return;

                if (redirect.indexOf("?error=") != -1) {
                    console.log("Spotify session rejected: " + redirect);
                    res(false);
                    return;
                }

                const CODE = redirect.substring(redirect.indexOf("?code=") + 6, redirect.indexOf("&state="));
                const RET_STATE = redirect.substring(redirect.indexOf("&state=") + 7);

                if (STATE != RET_STATE) {
                    console.log("Spotify state doesnt match: " + STATE + " != " + RET_STATE);
                    res(false);
                    return;
                }

                console.log("Spotify: Got oauth code.");

                const response =
                    await fetch(
                        SPOTIFY_ACCOUNTS_URL + "api/token",
                        {
                            method: 'POST',
                            headers: {
                                "Accept": "application/json",
                                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            },
                            body: "grant_type=authorization_code&client_id=" + CID + "&code=" + CODE + "&redirect_uri=https://spotify.com/nonexistent-vermilion&code_verifier=" + VERIFIER,
                        }
                    );

                response.json().then((data) => {
                    if (response.status != 200) {
                        console.log("Spotify: Failed to oauth token: " + response.status + ": " + response.statusText);
                        res(false);
                        return;
                    }

                    config.setConfigValue("spotifyRefreshToken", data.refresh_token);
                    config.setConfigValue("spotifyToken", data.access_token);
                    config.setConfigValue("spotifyClientID", CID);
                    config.setConfigValue("spotifyScopesObtained", data.scope);

                    console.log("Spotify: Auth'd!");

                    oauthWindow.close();

                    login().then((result) => {
                        res(result);
                    })
                });
            });
        }
    );
}

function trackToSongDataShort(track: any): SongDataShort {
    let artists: Array<ArtistDataShort> = [];
    let artistString = "";
    track.artists.forEach((x) => {
        artistString += x.name + ", ";
        artists.push({
            name: x.name,
            identifier: "" + x.id,
            source: "spotify",
        });
    });

    return {
        title: track.name,
        source: "spotify",
        identifier: track.id + "",
        duration: parseInt(track.duration_ms) / 1000,
        artists: artists,
        artistString: artistString.substring(0, artistString.length - 2),
        album: track.album.name,
        albumId: track.album.id + "",
        albumCoverUrl: track.album.images.length != 0 ? track.album.images[0].url : undefined,
    };
}

function artistToArtistData(artist: any): ArtistData {
    return {
        name: artist.name,
        identifier: artist.id + "",
        source: "spotify",
        topSongs: [],
        relatedArtists: [],
        newAlbums: [],
        imageURL: artist.images.length != 0 ? artist.images[0].url : undefined,
    };
}

function albumToAlbumDataShort(album: any): AlbumDataShort {
    let artists: Array<ArtistDataShort> = [];
    let artistString = "";
    album.artists.forEach((x) => {
        artistString += x.name + ", ";
        artists.push({
            name: x.name,
            identifier: "" + x.id,
            source: "spotify",
        });
    });

    return {
        name: album.name,
        source: "spotify",
        identifier: album.id + "",
        coverUrl: album.images.length != 0 ? album.images[0].url : undefined,
        duration: 0,
        songsNumber: album.total_tracks,
        artists: artists,
        artistString: artistString.substring(0, artistString.length - 2),
    };
}

function albumToAlbumData(album: any): AlbumData {
    let artists: Array<ArtistDataShort> = [];
    let artistString = "";
    album.artists.forEach((x) => {
        artistString += x.name + ", ";
        artists.push({
            name: x.name,
            identifier: "" + x.id,
            source: "spotify",
        });
    });

    let songs: Array<SongDataShort> = [];
    album.tracks.items.forEach((x) => {
        let artists2: Array<ArtistDataShort> = [];
        let artistString2 = "";
        x.artists.forEach((y) => {
            artistString2 += y.name + ", ";
            artists2.push({
                name: y.name,
                identifier: "" + y.id,
                source: "spotify",
            });
        });

        songs.push({
            title: x.name,
            identifier: x.id + "",
            source: "spotify",
            album: album.name,
            albumId: album.id + "",
            artistString: artistString2.substring(0, artistString2.length - 2),
            artists: artists2,
            duration: x.duration_ms / 1000,
        });
    });

    return {
        name: album.name,
        source: "spotify",
        identifier: album.id + "",
        coverUrl: album.images.length != 0 ? album.images[0].url : undefined,
        artist: artistString.substring(0, artistString.length - 2),
        year: album.release_date ? (album.release_date.indexOf('-') != -1 ? album.release_date.substring(0, album.release_date.indexOf('-')) : album.release_date) : undefined,
        date: album.release_date,
        copyright: album.label,
        songs: songs,
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

            if (!SPOTIFY_LOGGED_IN) {
                rej("Not logged in");
                return;
            }

            query = query.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');

            const response =
                await fetch(
                    SPOTIFY_API_URL + "v1/search?q=" + query + "&type=album,track,artist&limit=10",
                    {
                        method: 'GET',
                        headers: {
                            "Accept": "application/json",
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                        },
                    }
                );

            response.json().then((data) => {
                console.log("spotify: got " + data.tracks.items.length + " tracks");
                console.log("spotify: got " + data.artists.items.length + " artists");
                console.log("spotify: got " + data.albums.items.length + " albums");

                data.tracks.items.forEach((x) => {
                    const SHORT_DATA = trackToSongDataShort(x);

                    result.songs.push(SHORT_DATA);
                });

                data.artists.items.forEach((x) => {
                    const SHORT_DATA = artistToArtistData(x);

                    result.artists.push(SHORT_DATA);
                });

                data.albums.items.forEach((x) => {
                    const SHORT_DATA = albumToAlbumDataShort(x);

                    result.albums.push(SHORT_DATA);
                });

                res(result);
            }).catch((e) => {
                console.log("spotify: error " + response.status + ": " + response.statusText);
                rej("error searching");
            });
        }
    );
}

async function songFromID(identifier: string): Promise<SongDataShort> {
    return new Promise<SongDataShort>(async (res) => {

        let sd: SongDataShort = {
            identifier: identifier,
            source: "spotify",
            title: "Unknown title",
            artistString: "",
            album: "",
            duration: 0,
        };

        if (!SPOTIFY_LOGGED_IN) {
            res(sd);
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');

        const response =
            await fetch(
                SPOTIFY_API_URL + "v1/tracks/" + identifier,
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );

        response.json().then((data) => {
            sd = trackToSongDataShort(data);
            res(sd);
        }).catch((e) => {
            console.log("spotify: error " + response.status + ": " + response.statusText);
            res(sd);
        });

    });
}

async function play(identifier: string) {
    return new Promise<boolean>(async (res, rej) => {
        identifier = identifier.replaceAll(/[^A-Za-z-0-9\-\_ ]/g, '');

        if (!SPOTIFY_LOGGED_IN) {
            rej("Not logged in");
            return;
        }

        if (SPOTIFY_DEVICE_ID == "") {
            console.log("spotify: no device id??");
            rej("No device id (spotify player failed)");
            return;
        }

        console.log("spotify: playing " + identifier);

        playbackData.playing = true;
        playbackData.identifier = identifier;
        playbackData.elapsedSeconds = 0;

        songFromID(identifier).then((data) => {
            if (data.duration == 0) {
                playbackData.title = "";
                playbackData.album = "";
                playbackData.artist = "API failed";
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

        const response = await fetch(
            SPOTIFY_API_URL + "v1/me/player/play?device_id=" + SPOTIFY_DEVICE_ID,
            {
                method: 'PUT',
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                },
                body: JSON.stringify({
                    "uris": [
                        "spotify:track:" + identifier,
                    ],
                    "position_ms": 0,
                })
            }
        );

        if (response.status != 200) {
            console.log("spotify: error " + response.status + ": " + response.statusText);
            console.log(await response.text());
            res(false);
            return;
        }

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
            mainWindow.webContents.send('spotifyPlayEvent', {
                seek: seconds,
            });
            res(true);
        }
    );
}

async function setVolume(vol: number) {
    return new Promise<boolean>(
        async (res) => {
            mainWindow.webContents.send('spotifyPlayEvent', {
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
            mainWindow.webContents.send('spotifyPlayEvent', {
                play: play
            });
            playbackData.playing = play;
            res(true);
        }
    );
}

function setDeviceID(id: string) {
    SPOTIFY_DEVICE_ID = id;
}

function elapsed(seconds: number) {
    playbackData.elapsedSeconds = seconds;
}

async function getArtistData(identifier: string): Promise<ArtistData> {
    return new Promise<ArtistData>(async (res) => {
        let result: ArtistData = {
            name: "",
            topSongs: [],
            identifier: identifier,
            source: "spotify",
            relatedArtists: [],
            newAlbums: [],
        };

        if (!SPOTIFY_LOGGED_IN) {
            res(result);
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');

        const response =
            await fetch(
                SPOTIFY_API_URL + "v1/artists/" + identifier,
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );

        response.json().then(async (data) => {
            result = artistToArtistData(data);

            const TOP_TRACKS = await fetch(
                SPOTIFY_API_URL + "v1/artists/" + identifier + "/top-tracks",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );
            const ALBUMS = await fetch(
                SPOTIFY_API_URL + "v1/artists/" + identifier + "/albums",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );

            let completed = 0;

            TOP_TRACKS.json().then((j) => {
                j.tracks.forEach((t) => {
                    result.topSongs.push(trackToSongDataShort(t));
                });

                completed++;
                if (completed >= 2)
                    res(result);
            }).catch((e) => {
                console.log("spotify: error " + response.status + ": " + response.statusText);
                completed++;
                if (completed >= 2)
                    res(result);
            });

            ALBUMS.json().then((j) => {
                j.items.forEach((a) => {
                    result.newAlbums.push(albumToAlbumDataShort(a));
                });

                completed++;
                if (completed >= 2)
                    res(result);
            }).catch((e) => {
                console.log("spotify: error " + response.status + ": " + response.statusText);
                completed++;
                if (completed >= 2)
                    res(result);
            });

        }).catch((e) => {
            console.log("spotify: error " + response.status + ": " + response.statusText);
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

        if (!SPOTIFY_LOGGED_IN) {
            res(result);
            return;
        }

        identifier = identifier.replaceAll(/[^A-Za-z-0-9 \-\+\=\/\.\_]/g, '');

        const response =
            await fetch(
                SPOTIFY_API_URL + "v1/albums/" + identifier,
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );

        response.json().then((data) => {
            result = albumToAlbumData(data);
            res(result);
        }).catch((e) => {
            console.log("spotify: error " + response.status + ": " + response.statusText);
            res(result);
        });

    });
}

async function getPlaylists(): Promise<Array<PlaylistDataShort>> {
    return new Promise<Array<PlaylistDataShort>>(async (res, rej) => {
        let pd: Array<PlaylistDataShort> = [];

        if (!SPOTIFY_LOGGED_IN) {
            rej();
            return;
        }

        const response =
            await fetch(
                SPOTIFY_API_URL + "v1/users/" + SPOTIFY_USER_ID + "/playlists",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );

        response.json().then((data) => {
            data.items.forEach((p)=> {
                pd.push({
                    name: p.name,
                    source: "spotify",
                    identifier: p.id + "",
                    songsNumber: p.tracks.total,
                    duration: 0,
                });
            });
            
            res(pd);
        }).catch((e) => {
            console.log("spotify: error " + response.status + ": " + response.statusText);
            res(pd);
        });

    });
}

async function getPlaylistData(data: PlaylistDataShort): Promise<PlaylistData> {
    return new Promise<PlaylistData>(async (res) => {
        let pd: PlaylistData = {
            name: data.name,
            songs: [],
            source: "spotify",
            identifier: data.identifier
        };

        if (!SPOTIFY_LOGGED_IN) {
            res(pd);
            return;
        }

        const response =
            await fetch(
                SPOTIFY_API_URL + "v1/playlists/" + data.identifier,
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Authorization": "Bearer " + SPOTIFY_SESSION_TOKEN,
                    },
                }
            );

        response.json().then((data) => {
            data.tracks.items.forEach((p)=> {
                pd.songs.push(trackToSongDataShort(p.track));
            });
            
            res(pd);
        }).catch((e) => {
            console.log("spotify: error " + response.status + ": " + response.statusText);
            res(pd);
        });

    });
}

export default {
    login,
    attemptNewSession,
    performSearch,
    play,
    songFromID,
    setDeviceID,
    getPlayState,
    seek,
    pausePlay,
    setVolume,
    elapsed,
    getAlbumData,
    getArtistData,
    getPlaylists,
    getPlaylistData
}