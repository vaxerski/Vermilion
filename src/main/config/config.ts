import fs from 'fs';
import path from 'path';
import os from 'os';
import { mainWindow } from '..';

interface Config {
    // MPD
    mpdAddress?: string;
    mpdPort?: string;

    // Tidal
    tidalRefreshToken?: string;
    tidalClientID?: string;
    tidalToken?: string;

    // YT
    ytCookieSource?: string;
    ytBinaryPath?: string;

    // Spotify
    spotifyToken?: string;
    spotifyRefreshToken?: string;
    spotifyClientID?: string;
    spotifyScopesObtained?: string;

    // MPRIS
    mprisEnabled?: boolean;

    // Listenbrainz
    lbEnabled?: boolean;
    lbToken?: string;

    // other
    volume?: number;
};

const defaultConfig: Config = {
    mpdAddress: "localhost",
    mpdPort: "6600",
    tidalRefreshToken: "",
    tidalClientID: "",
    tidalToken: "",
    spotifyRefreshToken: "",
    spotifyClientID: "",
    spotifyToken: "",
    spotifyScopesObtained: "",
    ytCookieSource: "",
    ytBinaryPath: "",
    mprisEnabled: true,
    lbEnabled: true,
    lbToken: "",
    volume: 0.5,
};

let config: Config = defaultConfig;

const XDG_CONFIG_HOME = process.env.XDG_CONFIG_HOME;

const CONFIG_DIR = path.resolve(XDG_CONFIG_HOME ? XDG_CONFIG_HOME : os.homedir() + "/.config");

function loadConfig() {
    if (!fs.existsSync(CONFIG_DIR + "/vermilion"))
        fs.mkdirSync(CONFIG_DIR + "/vermilion");

    if (!fs.existsSync(CONFIG_DIR + "/vermilion/vermilion.json")) {
        // write default config
        fs.writeFileSync(CONFIG_DIR + "/vermilion/vermilion.json", JSON.stringify(
            config
        ));
    }

    const configPath = CONFIG_DIR + "/vermilion/vermilion.json";

    config = JSON.parse(fs.readFileSync(configPath).toString('utf-8'));
}

function writeConfig() {
    const configPath = CONFIG_DIR + "/vermilion/vermilion.json";
    fs.writeFile(configPath, JSON.stringify(
        config
    ), (e) => { if (e) { console.log("failed to write config: "); console.log(e); } });
}

function getConfigValue(member: string) {
    if (config[member] == undefined)
        return defaultConfig[member];

    return config[member];
}

function setConfigValue(member: string, value: any) {
    config[member] = value;
    writeConfig();
    mainWindow.webContents.send('sendSetting', { setting: member, value: value });
}

export default {
    loadConfig,
    getConfigValue,
    setConfigValue,
}