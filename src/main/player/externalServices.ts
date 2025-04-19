import config from "../config/config";
import { SongInfo } from "../types/songInfo";
import mpris from "./mpris/mpris";

// this sends an update into the ether. If it fails, it fails.
function updateSongInfo(song: SongInfo) {
    let mprisEnabled = config.getConfigValue("mprisEnabled");

    mpris.setEnabled(mprisEnabled);

    if (mprisEnabled)
        mpris.updateSongInfo(song);
}

export default {
    updateSongInfo
};