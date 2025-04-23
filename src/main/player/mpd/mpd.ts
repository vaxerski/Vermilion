import { SongDataShort } from "../../types/songData";
import { SongInfo } from "../../types/songInfo";
import { onSongEnded } from "../player";
import mpdApi from "mpd-api";

// We export two, because MPD_ALBUM_CLIENT needs to be
// separate as those calls take FOREVER and if two happen at once
// i.e. album is thinking and we ask anything, we get garb data.
export let MPD_CLIENT, MPD_ALBUM_CLIENT;

export let MPD_CONNECTED = false;

async function reconnect(host: string, port: number): Promise<boolean> {
    return new Promise<boolean>((res) => {
        mpdApi.connect({
            port: port,
            host: host,
        }).then((x) => {
            MPD_CLIENT = x;
            mpdApi.connect({
                port: port,
                host: host,
            }).then((x) => {
                MPD_ALBUM_CLIENT = x;
                MPD_CONNECTED = true;
                res(true);
            }).catch((e) => {
                res(false);
                MPD_CLIENT = undefined;
                MPD_CONNECTED = false;
            });
        }).catch((e) => {
            res(false);
        })
    });
}

async function listSongs(searchFor: string): Promise<Array<SongDataShort>> {
    return new Promise<Array<SongDataShort>>(
        async (res) => {
            if (searchFor == "" || !MPD_CONNECTED) {
                res([]);
                return;
            }

            searchFor = searchFor.replaceAll('\'', '');

            let songs: Array<SongDataShort> = [];
            let result = [];
            try {
                result = await MPD_CLIENT.api.db.find("(any contains_ci '" + searchFor + "')", "sort", "Album");
            } catch (e) {
                res([]);
            }

            for (let i = 0; i < result.length; ++i) {
                songs.push(
                    {
                        identifier: result[i].file,
                        source: "mpd",
                        title: result[i].title,
                        artistString: result[i].artist == "" ? result[i].album_artist : result[i].artist,
                        album: result[i].album,
                        duration: result[i].duration
                    }
                );
            }

            res(songs);
        }
    );
}

async function play(identifier: string) {
    return new Promise<boolean>(async (res) => {
        if (!MPD_CONNECTED) {
            res(false);
            return;
        }

        try {
            await MPD_CLIENT.api.queue.clear();
            await MPD_CLIENT.api.queue.add(identifier);
            await MPD_CLIENT.api.playback.play(0);
        } catch (e) {
            res(false);
        }
        res(true);
    });
}

async function seek(seconds: number) {
    return new Promise<boolean>(
        async (res) => {
            if (!MPD_CONNECTED) {
                res(false);
                return;
            }

            try {
                await MPD_CLIENT.api.playback.seek("0", seconds);
            } catch (e) {
                res(false);
            }
            res(true);
        }
    );
}

async function setVolume(vol: number) {
    return new Promise<boolean>(
        async (res) => {
            if (!MPD_CONNECTED) {
                res(false);
                return;
            }

            try {
                await MPD_CLIENT.api.playback.setvol(Math.round(vol));
            } catch (e) {
                res(false);
            }
            res(true);
        }
    );
}

let lastSongPath: string = ""
let lastSongImage: string = ""
let lastSongUpdated: boolean = false

function getImage(file: string) {
    lastSongImage = "";

    if (!MPD_CONNECTED)
        return;

    setTimeout(
        async () => {
            try {
                let mpdAlbum = await MPD_ALBUM_CLIENT.api.db.readpictureWhole(file);
                if (mpdAlbum != undefined) {
                    lastSongImage = "data:" + mpdAlbum.mime + ";base64," + mpdAlbum.buffer.toString('base64');
                    lastSongUpdated = true;
                } else
                    console.log("No file exists for album cover.");
            } catch (e) {
                console.log(e);
            }

        }
        , 1);
}

async function getPlayState(): Promise<SongInfo> {
    return new Promise<SongInfo>(
        async (res) => {
            let data: SongInfo = {
                title: "Nothing is playing",
                artist: "",
                album: "",
                elapsedSeconds: 0,
                totalSeconds: 0,
                playing: false,
                albumCover: "",
                albumCoverUpdated: lastSongUpdated,
                identifier: "",
                source: "mpd",
                volume: -1,
            };


            if (!MPD_CONNECTED) {
                res(data);
                return;
            }

            const playing = await MPD_CLIENT.api.status.currentsong();
            const status = await MPD_CLIENT.api.status.get();

            if (playing != undefined) {
                data.title = playing.title;
                if (data.title == "")
                    data.title = "Nothing is playing"
                data.artist = playing.artist;
                if (data.artist.length == 0)
                    data.artist = playing.album_artist;
                data.album = playing.album;
                data.totalSeconds = playing.duration;
                if (data.totalSeconds <= 0 || isNaN(data.totalSeconds))
                    data.totalSeconds = 0;
                data.elapsedSeconds = status.elapsed;
                if (data.elapsedSeconds <= 0 || isNaN(data.elapsedSeconds))
                    data.elapsedSeconds = 0;
                data.playing = status.state == "play";
                data.volume = status.volume;

                let file: string = playing.file;
                data.identifier = file;

                if (lastSongPath != file) {
                    getImage(file);
                    lastSongPath = file;
                } else
                    data.albumCover = lastSongImage;

                if (lastSongUpdated)
                    lastSongUpdated = false;
            }

            res(data);
        }
    );
}

async function pausePlay(play: boolean): Promise<boolean> {
    return new Promise<boolean>(
        async (res) => {
            if (!MPD_CONNECTED) {
                res(false);
                return;
            }

            try {
                if (play)
                    await MPD_CLIENT.api.playback.resume();
                else
                    await MPD_CLIENT.api.playback.pause();
            } catch (e) {
                res(false);
            }
            res(true);
        }
    );
}

async function songFromID(identifier: string): Promise<SongDataShort> {
    return new Promise<SongDataShort>(
        async (res) => {

            identifier = identifier.replaceAll('\'', '');

            let sd: SongDataShort = {
                identifier: "",
                source: "mpd",
                artistString: "",
                title: "",
                album: "",
                duration: 0
            };

            if (!MPD_CONNECTED) {
                res(sd);
                return;
            }

            let result;
            try {
                result = await MPD_CLIENT.api.db.find("(file == '" + identifier + "')", "sort", "Album");
            } catch (e) {
                res(sd);
            }

            for (let i = 0; i < result.length; ++i) {
                res(
                    {
                        identifier: result[i].file,
                        source: "mpd",
                        artistString: result[i].artist == "" ? result[i].album_artist : result[i].artist,
                        album: result[i].album,
                        title: result[i].title,
                        duration: result[i].duration
                    }
                );
                return;
            }
        }
    );
}


export default {
    reconnect,
    listSongs,
    play,
    seek,
    setVolume,
    getPlayState,
    pausePlay,
    songFromID,
};