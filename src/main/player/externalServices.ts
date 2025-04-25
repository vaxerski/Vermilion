import config from "../config/config";
import { SongInfo } from "../types/songInfo";
import discord from "./discord/discord";
import listenbrainz from "./listenbrainz/listenbrainz";
import mpris from "./mpris/mpris";

// this sends an update into the ether. If it fails, it fails.
function updateSongInfo(song: SongInfo) {
    let mprisEnabled = config.getConfigValue("mprisEnabled");
    let lbEnabled = config.getConfigValue("lbEnabled");
    let dcEnabled = config.getConfigValue("dcEnabled");

    mpris.setEnabled(mprisEnabled);
    listenbrainz.setEnabled(lbEnabled);
    discord.setEnabled(dcEnabled);

    if (mprisEnabled)
        mpris.updateSongInfo(song);
    if (lbEnabled)
        listenbrainz.updateSongInfo(song);
    if (dcEnabled)
        discord.updateSongInfo(song);
}

export default {
    updateSongInfo
};