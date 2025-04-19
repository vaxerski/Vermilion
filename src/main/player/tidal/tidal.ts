import { mainWindow } from "../..";
import config from "../../config/config";
import { SongDataShort } from "../../types/songData";
import { SongInfo } from "../../types/songInfo";

function getToken() {
    return config.getConfigValue("tidalToken");
}

const TIDAL_URL = "https://listen.tidal.com/";
const TIDAL_RESOURCES_URL = "https://resources.tidal.com/";
const TIDAL_SEARCH_API_ENDPOINT = "v2/search/"
const TIDAL_TRACK_API_ENDPOINT = "v1/tracks/"
const TIDAL_PLAYBACKINFO_ENDPOINT_AFTER = "/playbackinfo"
const TIDAL_SESSION_API_ENDPOINT = "v1/sessions"

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

async function listSongs(searchFor: string): Promise<Array<SongDataShort>> {
    return new Promise<Array<SongDataShort>>(
        async (res, rej) => {
            const TOKEN = getToken();

            if (TOKEN == "") {
                rej("No Tidal token configured");
                return;
            }

            const SEARCHNO = Math.max(Math.min(parseInt(config.getConfigValue("tidalSearchNumber")), 100), 0);

            // rid of all bad chars
            searchFor = searchFor.replaceAll(/[^A-Za-z-0-9 ]/g, '');

            console.log("Searching Tidal for \"" + searchFor + "\"");

            let songs: Array<SongDataShort> = [];

            try {
                const response =
                    await fetch(
                        TIDAL_URL + TIDAL_SEARCH_API_ENDPOINT + "?includeContributors=true&includeDidYouMean=true&includeUserPlaylists=false&limit=" + SEARCHNO + "&types=TRACKS&countryCode=" + TIDAL_COUNTRY_CODE + "&locale=en_US&query=" + searchFor,
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
                    if (data.tracks.items.length == 0) {
                        rej("No tracks returned from Tidal");
                        return;
                    }

                    console.log("Tidal returned " + data.tracks.items.length + " results.");

                    data.tracks.items.forEach((e) => {
                        songs.push(
                            {
                                title: e.title,
                                album: e.album ? e.album.title : "unknown",
                                duration: e.duration,
                                artist: e.artists[0].name,
                                source: "tidal",
                                identifier: "" + e.id,
                                albumCoverUrl: e.album && e.album.cover ? (TIDAL_RESOURCES_URL + "images/" + e.album.cover.replaceAll('-', '/') + "/1280x1280.jpg") : undefined,
                            }
                        );
                    });

                    res(songs);
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
                    if (!data.sessionId || !data.countryCode) {
                        res(false);
                        return;
                    }

                    TIDAL_COUNTRY_CODE = data.countryCode;
                    TIDAL_SESSION_ID = data.sessionId;

                    console.log("Got tidal session for country " + TIDAL_COUNTRY_CODE);

                    res(true);
                });


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

                console.log("Tidal returned " + parseInt(data.sampleRate / 100) / 10 + "kHz " + data.bitDepth + "b stream data.");

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

            res(sd);
        }).catch((e) => {
            console.log(e);
            res(sd);
        })
    });
}

export default {
    listSongs,
    play,
    login,
    seek,
    setVolume,
    getPlayState,
    pausePlay,
    elapsed,
    songFromID
}