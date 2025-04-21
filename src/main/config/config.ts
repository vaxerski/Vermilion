import fs from 'fs';
import path from 'path';
import os from 'os';

interface Config {
    // MPD
    mpdAddress?: string;
    mpdPort?: string;

    // Tidal
    tidalRefreshToken?: string;
    tidalClientID?: string;
    tidalToken?: string;

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
    mprisEnabled: true,
    lbEnabled: true,
    lbToken: "",
    volume: 0.5,
};

let config: Config = defaultConfig;

const CONFIG_DIR = path.resolve(os.homedir() + "/.config");

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
    fs.writeFileSync(configPath, JSON.stringify(
        config
    ));
}

function getConfigValue(member: string) {
    if (config[member] == undefined)
        return defaultConfig[member];

    return config[member];
}

function setConfigValue(member: string, value: any) {
    config[member] = value;
    writeConfig();
}

export default {
    loadConfig,
    getConfigValue,
    setConfigValue,
}