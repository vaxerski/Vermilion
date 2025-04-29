import YTMusic, { SongDetailed } from "ytmusic-api";
import { SearchResults } from "../types/searchResults";
import { mainWindow } from "..";
import { SongInfo } from "../types/songInfo";
import { SongDataShort } from "../types/songData";
import { AlbumDataShort } from "../types/albumDataShort";
import config from "../config/config";
import { isWindows } from "../helpers/helpers";
const YTDlpWrap = require("yt-dlp-wrap").default;

const ytmusic = new YTMusic();
ytmusic.initialize();

// With yt, we get elapsed fed from the render thread
const playbackData: SongInfo = {
  title: "Nothing is playing",
  artist: "",
  album: "",
  elapsedSeconds: 0,
  totalSeconds: 0,
  playing: false,
  albumCover: "",
  albumCoverUpdated: false,
  identifier: "",
  source: "yt",
  volume: -1,
};

const idToAlbumMap: Map<string, AlbumDataShort> = new Map();
const idToShortDataMap: Map<string, SongDataShort> = new Map();
let ytDlpWrap;

function newYTDlpWrap(): void {
  if (ytDlpWrap) {
    return;
  }

  if (isWindows) {
    const binarypath = config.getConfigValue("ytBinaryPath");
    ytDlpWrap = new YTDlpWrap(binarypath);
  } else {
    ytDlpWrap = new YTDlpWrap();
  }
}

function toSongDataShort(s: SongDetailed): SongDataShort {
  return {
    identifier: s.videoId,
    source: "yt",
    title: s.name,
    artists: [
      {
        name: s.artist.name,
        identifier: s.artist.artistId,
        source: "yt",
      },
    ],
    artistString: s.artist.name,
    album: s.album.name,
    albumId: s.album.albumId,
    duration: s.duration,
    albumCoverUrl:
      s.thumbnails.length == 0
        ? undefined
        : s.thumbnails[s.thumbnails.length - 1].url,
  };
}

async function performSearch(query: string): Promise<SearchResults> {
  return new Promise<SearchResults>(async (res, rej) => {
    const result: SearchResults = {
      songs: [],
      albums: [],
      artists: [],
    };

    // Do this synchronously to avoid a 429.
    const YT_SONGS = await ytmusic.searchSongs(query);
    const YT_ALBUMS = await ytmusic.searchAlbums(query);
    const YT_ARTISTS = await ytmusic.searchArtists(query);

    console.log("yt: got " + YT_SONGS.length + " songs");

    YT_SONGS.forEach((s) => {
      const SHORT_DATA = toSongDataShort(s);

      result.songs.push(SHORT_DATA);

      if (!idToShortDataMap.has(s.videoId))
        idToShortDataMap.set(s.videoId, SHORT_DATA);

      if (!idToAlbumMap.has(s.videoId)) {
        idToAlbumMap.set(s.videoId, {
          name: s.album.name,
          identifier: s.album.albumId,
          source: "yt",
          songsNumber: 0,
          duration: 0,
          artists: [
            {
              name: s.artist.name,
              identifier: s.artist.artistId,
              source: "yt",
            },
          ],
          artistString: s.artist.name,
        });
      }
    });

    console.log("yt: got " + YT_ALBUMS.length + " albums");

    YT_ALBUMS.forEach((a) => {
      result.albums.push({
        name: a.name,
        artists: [
          {
            name: a.artist.name,
            identifier: a.artist.artistId,
            source: "yt",
          },
        ],
        artistString: a.artist.name,
        source: "yt",
        identifier: a.albumId,
        songsNumber: 0,
        duration: 0,
        coverUrl: a.thumbnails.length == 0 ? undefined : a.thumbnails[0].url,
      });
    });

    console.log("yt: got " + YT_ARTISTS.length + " artists");

    YT_ARTISTS.forEach((a) => {
      result.artists.push({
        name: a.name,
        identifier: a.artistId,
        source: "yt",
        topSongs: [],
        relatedArtists: [],
        newAlbums: [],
        imageURL: a.thumbnails.length == 0 ? undefined : a.thumbnails[0].url,
      });
    });

    res(result);
  });
}

async function play(identifier: string) {
  return new Promise<boolean>(async (res, rej) => {
    newYTDlpWrap();
    identifier = identifier.replaceAll(/[^A-Za-z-0-9\-\_ ]/g, "");

        let params: string[] = [
            "https://youtube.com/watch?v=" + identifier,
            "-x",
            "-f",
            "bestaudio"
        ];

    const BROWSER_FOR_COOKIES = config.getConfigValue("ytCookieSource");
    console.dir(BROWSER_FOR_COOKIES);
    if (BROWSER_FOR_COOKIES != "")
      params = params.concat(["--cookies-from-browser", BROWSER_FOR_COOKIES]);

    try {
      const stream = ytDlpWrap.execStream(params);
      let fullData: Buffer = Buffer.alloc(0);
      stream.on("data", (data: Buffer) => {
        console.log("yt stream: got " + data.byteLength + " bytes");

        fullData = Buffer.concat([fullData, data]);

        const B64 =
          "data:audio/ogg;base64," + Buffer.from(fullData).toString("base64");
        mainWindow.webContents.send("playGeneric", B64);
      });
    } catch (e) {
      res(false);
    }

    playbackData.playing = true;
    playbackData.identifier = identifier;
    playbackData.elapsedSeconds = 0;

    songFromID(identifier).then((data) => {
      if (data.duration == 0) {
        playbackData.title = "";
        playbackData.album = "";
        playbackData.artist = "Blocked from API";
        playbackData.albumCover = "";
        playbackData.totalSeconds = 0;
        playbackData.elapsedSeconds = 0;
      } else {
        playbackData.title = data.title;
        playbackData.album = data.album;
        playbackData.artist = data.artistString;
        playbackData.albumCover = data.albumCoverUrl;
        playbackData.totalSeconds = data.duration;
        playbackData.albumCoverUpdated = true;
      }
    });

    res(true);
  });
}

async function seek(seconds: number) {
  return new Promise<boolean>(async (res) => {
    if (playbackData.totalSeconds == 0) {
      res(false);
      return;
    }
    mainWindow.webContents.send("genericPlayerPlayEvent", {
      seek: seconds,
    });
    res(true);
  });
}

async function setVolume(vol: number) {
  return new Promise<boolean>(async (res) => {
    mainWindow.webContents.send("genericPlayerPlayEvent", {
      volume: Math.round(vol) / 100,
    });
    res(true);
  });
}

async function getPlayState(): Promise<SongInfo> {
  return new Promise<SongInfo>((res) => {
    const pbdata = { ...playbackData }; // clone
    playbackData.albumCoverUpdated = false;
    res(pbdata);
  });
}

async function pausePlay(play: boolean): Promise<boolean> {
  return new Promise<boolean>(async (res) => {
    mainWindow.webContents.send("genericPlayerPlayEvent", {
      play: play,
    });
    playbackData.playing = play;
    res(true);
  });
}

async function elapsed(seconds: number) {
  playbackData.elapsedSeconds = seconds;
}

async function songFromID(identifier: string): Promise<SongDataShort> {
  return new Promise<SongDataShort>(async (res) => {
    let sd: SongDataShort = {
      identifier: identifier,
      source: "yt",
      title: "Unknown title",
      artistString: "",
      album: "",
      duration: 0,
    };

    identifier = identifier.replaceAll(/[^A-Za-z-0-9\-\_ ]/g, "");

    ytmusic
      .getSong(identifier)
      .then((s) => {
        const HAS_ALBUM = idToAlbumMap.has(identifier);

        sd = {
          identifier: s.videoId,
          source: "yt",
          title: s.name,
          artists: [
            {
              name: s.artist.name,
              identifier: s.artist.artistId,
              source: "yt",
            },
          ],
          artistString: s.artist.name,
          album: HAS_ALBUM ? idToAlbumMap.get(identifier).name : "",
          albumId: HAS_ALBUM
            ? idToAlbumMap.get(identifier).identifier
            : undefined,
          albumCoverUrl: HAS_ALBUM
            ? idToAlbumMap.get(identifier).coverUrl
            : undefined,
          duration: s.duration,
        };
        res(sd);
      })
      .catch(async (e) => {
        console.log(
          "yt: song " +
            identifier +
            " errd, likely blocked. Checking cache, then trying a search.",
        );
        if (idToShortDataMap.has(identifier)) {
          console.log("yt: song is in cache, returning that");
          res(idToShortDataMap.get(identifier));
          return;
        }

        console.log("yt: song is not cached, searching");

        const YT_SONGS = await ytmusic.searchSongs(identifier);

        if (YT_SONGS.length == 0) {
          console.log("yt: search didn't yield anything :(");
          res(sd);
          return;
        }

        let found: boolean = false;
        YT_SONGS.forEach((s) => {
          if (s.videoId != identifier || found) return;

          found = true;
          console.log("yt: search found the id");

          const SHORT_DATA = toSongDataShort(s);
          res(SHORT_DATA);
        });

        if (!found) {
          console.log("yt: nothing worked. :(");
          console.log(e);
          res(sd);
        }
      });
  });
}

export default {
  elapsed,
  seek,
  pausePlay,
  getPlayState,
  setVolume,
  performSearch,
  play,
  songFromID,
};
