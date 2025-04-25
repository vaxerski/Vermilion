import { Client, SetActivity } from "@xhayper/discord-rpc";
import config from "../../config/config";
import { SongInfo } from "../../types/songInfo";

let enabled = false;

const ACTIVITY_LISTENING = 2;

// this gets called every 500ms, throttle it 6 times to not spam DC.
let discordThrottle = 0;

let discordClient = undefined;

const IDLE_PRESENCE = {
    // largeImageKey: "vermilion-big",
    //largeImageText: `Vermilion`,
    instance: false,
    type: ACTIVITY_LISTENING
};

function updateSongInfo(song: SongInfo) {
    if (!discordClient)
        return;

    if (discordThrottle < 6) {
        discordThrottle++;
        return;
    }

    discordThrottle = 0;

    if (!song.playing || song.artist == "" || song.title == "") {
        discordClient.user?.setActivity(IDLE_PRESENCE);
        return;
    }

    let activity: SetActivity = {
        details: song.title,
        state: song.artist,
        largeImageKey: song.albumCover ? song.albumCover : undefined,
        largeImageText: song.album,
        startTimestamp: Date.now() / 1000 - song.elapsedSeconds,
        endTimestamp: Date.now() / 1000 - song.elapsedSeconds + song.totalSeconds,
        instance: false,
        type: ACTIVITY_LISTENING,
    };

    discordClient.user?.setActivity(activity);
}

function setEnabled(enable: boolean) {
    if (enabled == enable)
        return;

    enabled = enable;

    console.log("Discord: " + enable);

    if (enabled) {
        discordClient = new Client({ clientId: "1363286212915499108" });
        discordClient.on("ready", () => {
            console.log("Discord RPC: ready");
        });
        discordClient.login();
    } else {
        discordClient.destroy();
        discordClient = undefined;
    }
}

export default {
    updateSongInfo,
    setEnabled,
};