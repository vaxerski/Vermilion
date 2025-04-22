import config from "../../config/config";
import { SongInfo } from "../../types/songInfo";


let enabled = true;

let lastIdentifier = '';
let lastIdentifierSubmittedAsListen = false;

// this gets called every 500ms, throttle it 6 times to not spam LB.
let listenbrainzThrottle = 0;

function updateSongInfo(song: SongInfo) {
    if (listenbrainzThrottle < 6) {
        listenbrainzThrottle++;
        return;
    }

    listenbrainzThrottle = 0;

    if (!song.playing)
        return;

    const TOKEN = config.getConfigValue("lbToken");

    if (TOKEN == "")
        return;

    if (lastIdentifier != song.identifier)
        lastIdentifierSubmittedAsListen = false;

    lastIdentifier = song.identifier;

    const SHOULD_SUBMIT_AS_LISTEN = song.elapsedSeconds > 240 || song.elapsedSeconds > song.totalSeconds * 0.5;

    const LISTEN_TYPE = SHOULD_SUBMIT_AS_LISTEN && !lastIdentifierSubmittedAsListen ? "single" : "playing_now";

    if (SHOULD_SUBMIT_AS_LISTEN && !lastIdentifierSubmittedAsListen)
        lastIdentifierSubmittedAsListen = true;

    let payload: any = [
        {
            "track_metadata": {
                "artist_name": song.artist,
                "track_name": song.title,
                "release_name": song.album,
                "additional_info": {
                    "media_player": "Vermilion",
                    "submission_client": "Vermilion",
                }
            }
        }
    ];

    if (LISTEN_TYPE == "single")
        payload[0].listened_at = Date.now() / 1000 - song.elapsedSeconds;

    fetch(
        "https://api.listenbrainz.org/1/submit-listens",
        {
            method: "POST",
            headers: {
                "Authorization": "Token " + TOKEN
            },
            body: JSON.stringify(
                {
                    "listen_type": LISTEN_TYPE,
                    "payload": payload
                }
            )
        }
    ).then((res) => {
        if (res.status != 200) {
            res.json().then((json) => {
                console.error("LB ponged an error:");
                console.error(res);
                console.error(json);
            })
        }
    }).catch((e) => {
        console.error("Failed to submit to LB");
        console.error(e);
    });
}

function setEnabled(enable: boolean) {
    if (enabled == enable)
        return;

    enabled = enable;
}

export default {
    updateSongInfo,
    setEnabled,
};