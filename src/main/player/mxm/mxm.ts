import config from "../../config/config";
import { LyricData } from "../../types/lyricData";
import { SongDataShort } from "../../types/songData";

let MXM_LOGGED_IN: boolean = false;
let MXM_TOKEN: string = "";

async function connect() {
    if (config.getConfigValue("mxmToken") != "") {
        MXM_TOKEN = config.getConfigValue("mxmToken");
        return;
    }

    const response =
        await fetch(
            "https://apic-desktop.musixmatch.com/ws/1.1/token.get?app_id=web-desktop-app-v1.0",
            {
                method: 'GET',
                headers: {
                    "Accept": "*/*",
                    "authority": "apic-desktop.musixmatch.com",
                    "cookie": "x-mxm-user-id=undefined; x-mxm-token-guid=undefined; mxm-encrypted-token="
                }
            }
        );

    response.json().then(async (data) => {
        console.log(data);

        if (!data.user_token) {
            return;
        }

        MXM_LOGGED_IN = true;
        MXM_TOKEN = data.user_token;

        config.setConfigValue("mxmToken", data.user_token);

        console.log("mxm: logged in");
    }).catch((e) => {
        console.log("mxm: couldn't get a token");
    });
}

async function getLyricsForSong(song: SongDataShort): Promise<LyricData> {
    return new Promise<LyricData>(async (res, rej) => {
        const response =
            await fetch(
                "https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get?format=json&namespace=lyrics_richsynched&subtitle_format=mxm&app_id=web-desktop-app-v1.0?"
                + "q_album=" + song.album + "?q_artist=" + song.artistString + "?q_artists=" + song.artistString + "?q_track=" + song.title + "?q_duration=" + song.duration + "?f_subtitle_length=" + song.duration
                + "?usertoken=" + MXM_TOKEN + "?track_spotify_id=",
                {
                    method: 'GET',
                    headers: {
                        "Accept": "application/json",
                        "authority": "apic-desktop.musixmatch.com",
                        "cookie": "x-mxm-token-guid=",
                        "user-agent": "Mozilla/5.0 (X11; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0",
                    }
                }
            );

        response.json().then(async (data) => {
            console.log(data);

            res({
                lyrics: [],
                rawLyrics: [],
            });
        }).catch((e) => {
            console.log("mxm: couldn't get lyrics");
            rej("failed");
        });
    });
}

export default {
    connect,
    getLyricsForSong,
}