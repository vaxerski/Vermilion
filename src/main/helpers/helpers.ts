import os from "os";

export const isMac = os.platform() === "darwin";
export const isWindows = os.platform() === "win32";
export const isLinux = os.platform() === "linux";

function monthToString(m: string): string {
    switch (parseInt(m)) {
        case 1:
            return 'Jan';
        case 2:
            return 'Feb';
        case 3:
            return 'Mar';
        case 4:
            return 'Apr';
        case 5:
            return 'May';
        case 6:
            return 'Jun';
        case 7:
            return 'Jul';
        case 8:
            return 'Aug';
        case 9:
            return 'Sep';
        case 10:
            return 'Oct';
        case 11:
            return 'Nov';
        case 12:
            return 'Dec';
    }

    return '';
}

function prettyDate(ymd: Array<string>): string {
    return ymd[2] + " " + monthToString(ymd[1]) + " " + ymd[0];
}

export default {
    prettyDate
}