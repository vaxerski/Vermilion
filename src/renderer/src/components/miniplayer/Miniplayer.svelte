<script lang="ts">
    import type { LyricData } from "../../../../main/types/lyricData";
    import type { SongInfo } from "../../../../main/types/songInfo";
    import { playerData } from "../state/sharedState.svelte";
    import SongEntryMenu from "../view/pages/shared/SongEntryMenu.svelte";
    import Lyrics from "./fullscreen/Lyrics.svelte";
    import PausePlay from "./parts/PausePlay.svelte";

    function prettyTime(time: number) {
        if (time <= 0) return "0:00";
        let mins: number = Math.floor(time / 60);
        let secs: number = Math.floor(time - mins * 60);
        return secs > 9 ? mins + ":" + secs : mins + ":0" + secs;
    }

    const pausePlayback = (): void =>
        window.electron.ipcRenderer.send("pausePlayback");
    const resumePlayback = (): void =>
        window.electron.ipcRenderer.send("resumePlayback");
    const playNext = (): void => window.electron.ipcRenderer.send("playNext");
    const playPrevious = (): void =>
        window.electron.ipcRenderer.send("playPrevious");

    let currentSongData: SongInfo = $state({
        title: "",
        artist: "",
        album: "",
        elapsedSeconds: 0,
        totalSeconds: 0,
        playing: false,
        albumCover: "",
        albumCoverUpdated: false,
        identifier: "",
        source: "",
        volume: 0,
    });

    let currentSongLyrics: LyricData = $state({
        lyrics: [],
        rawLyrics: [],
    });

    window.electronAPI.updateCurrentSong((res) => {
        if (res.lyricsUpdated) currentSongLyrics = res.lyrics;

        currentSongData = res;

        if (
            res.albumCoverUpdated &&
            res.albumCover != document.getElementById("cover").src
        )
            document.getElementById("cover").src = res.albumCover;

        if (!seeking)
            document.getElementById("progress-foreground").style.width =
                (res.elapsedSeconds / res.totalSeconds) * 100 + "%";

        if (res.albumCover == "" && res.albumCoverUpdated) {
            document.getElementById("cover").style.visibility = "hidden";
            document.getElementById("coverMissing").style.visibility =
                "visible";
        } else if (res.albumCover != "" && res.albumCoverUpdated) {
            document.getElementById("coverMissing").style.visibility = "hidden";
            document.getElementById("cover").style.visibility = "visible";
        }
    });

    let lastMouseX = 0;
    let lastMouseY = 0;

    // ------------------ Seek Bar ------------------ //
    let seeking = $state(false);
    let seekValue = 0;

    addEventListener("mousedown", (e) => {
        if (document.getElementById("total").innerHTML == "0:00") return;

        const SEEKBAR = document.getElementById("progress-background");
        let BB = SEEKBAR.getBoundingClientRect();
        BB.y -= 5;
        BB.height += 10;

        if (
            e.clientX > BB.x + BB.width ||
            e.clientX < BB.x ||
            e.clientY > BB.y + BB.height ||
            e.clientY < BB.y
        )
            return;

        seekValue = (e.clientX - BB.x) / BB.width;
        seeking = true;

        document.getElementById("progress-foreground").style.width =
            seekValue * 100 + "%";
    });

    addEventListener("mousemove", (e) => {
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;

        if (!seeking) return;
        const SEEKBAR = document.getElementById("progress-background");
        let BB = SEEKBAR.getBoundingClientRect();
        BB.y -= 5;
        BB.height += 10;

        if (
            e.clientX > BB.x + BB.width ||
            e.clientX < BB.x ||
            e.clientY > BB.y + BB.height ||
            e.clientY < BB.y
        )
            return;

        seekValue = (e.clientX - BB.x) / BB.width;
        document.getElementById("progress-foreground").style.width =
            seekValue * 100 + "%";
    });

    addEventListener("mouseup", () => {
        if (!seeking) return;

        window.electron.ipcRenderer.send("playbackSeek", seekValue);
        seeking = false;
    });

    // ------------------ Volume Bar ------------------ //

    let volume = 50;
    let volumeBackup = 0;
    let volumeing = false;
    let reportedVolume = 50;

    function onClickOnVolumeIcon() {
        let temp = volume
        volume = volume == 0 ? volumeBackup : 0
        volumeBackup = temp == 0 ? 0 : temp

        console.log("hey")

        document.getElementById("volume-foreground").style.height =
            volume + "%";
    }

    function onClickOnVolumeBar() {
        volumeing = true;

        const VOLUMECONTAINER = document.getElementById("volume-container");
        const VOLUMEBG = document.getElementById("volume-background");
        let BB = VOLUMECONTAINER.getBoundingClientRect();
        let BB2 = VOLUMEBG.getBoundingClientRect();

        if (
            lastMouseX > BB.x + BB.width ||
            lastMouseX < BB.x ||
            lastMouseY > BB.y + BB.height ||
            lastMouseY < BB.y
        )
            return;

        volume = Math.min(
            Math.max((1 - (lastMouseY - BB2.y) / BB2.height) * 100, 0),
            100,
        );

        document.getElementById("volume-foreground").style.height =
            volume + "%";
    }

    addEventListener("mousemove", (e) => {
        if (!volumeing) return;

        const VOLUMECONTAINER = document.getElementById("volume-container");
        const VOLUMEBG = document.getElementById("volume-background");
        let BB = VOLUMECONTAINER.getBoundingClientRect();
        let BB2 = VOLUMEBG.getBoundingClientRect();

        if (
            e.clientX > BB.x + BB.width ||
            e.clientX < BB.x ||
            e.clientY > BB.y + BB.height ||
            e.clientY < BB.y
        )
            return;

        volume = Math.min(
            Math.max((1 - (e.clientY - BB2.y) / BB2.height) * 100, 0),
            100,
        );

        document.getElementById("volume-foreground").style.height =
            volume + "%";
    });

    addEventListener("mouseup", () => {
        if (!volumeing) return;

        volumeing = false;
    });

    setInterval(() => {
        if (reportedVolume != volume)
            window.electron.ipcRenderer.send("setVolume", volume);
    }, 250);

    // ------------------ Context menu ------------------ //

    let contextMenuOpen = $state(false);
    let contextMenuOpacity = $state(0);

    function openMenu() {
        if (contextMenuOpen) {
            closeMenu();
            return;
        }
        contextMenuOpen = true;
        setTimeout(() => {
            contextMenuOpacity = 1;
        }, 1);
    }

    function closeMenu() {
        contextMenuOpacity = 0;
        setTimeout(() => {
            contextMenuOpen = false;
        }, 150);
    }

    // ------------------ Fullscreen ------------------ //

    let fullscreen = $state(false);
    let fullscreenViewMode = $state(0);

    function toggleFullscreen() {
        fullscreen = !fullscreen;
        playerData.fullscreen = fullscreen;
    }

    function setViewClear() {
        fullscreenViewMode = 0;
    }

    function setViewLyrics() {
        fullscreenViewMode = 1;
    }

    function miniplayerDoubleClickHandler(e: MouseEvent) {
        const whitelist = [
            'miniplayer-container',
            'miniplayer-text',
            'miniplayer-player-album-cover',
            'miniplayer-nav-container',
            'miniplayer-time',
            'miniplayer-player-container',
        ];

        if (whitelist.some(x => (e.target as HTMLElement).classList.contains(x))) {
            toggleFullscreen();
        }
    }
</script>

<div class="miniplayer-container" on:dblclick={miniplayerDoubleClickHandler}>
    <!-- Auxiliary icons (more, fullscreen, volume, like) -->

    <div
        class="miniplayer-player-icon-container miniplayer-player-volume-container"
    >
        <i class="miniplayer-icon fa-solid fa-volume-low" on:mousedown={onClickOnVolumeIcon} />
        <div class="miniplayer-volume-bar-container" id="volume-container">
            <div
                class="miniplayer-volume-bar-container-inner"
                on:mousedown={onClickOnVolumeBar}
            >
                <div class="miniplayer-volume-bar-container-inner-2">
                    <div
                        class="miniplayer-volume-bar miniplayer-volume-bar-background"
                        id="volume-background"
                    ></div>
                    <div
                        class="miniplayer-volume-bar miniplayer-volume-bar-foreground"
                        id="volume-foreground"
                    ></div>
                </div>
            </div>
        </div>
    </div>

    <div
        class="miniplayer-player-icon-container miniplayer-player-fullscreen-container"
        style="transform:scale(92%) translateY(-7%)"
        on:click={toggleFullscreen}
    >
        <i
            class="miniplayer-icon fa-solid fa{fullscreen
                ? '-down-left-and-up-right-to-center'
                : '-up-right-and-down-left-from-center'}"
        />
    </div>

    <div
        class="miniplayer-player-icon-container miniplayer-player-favorite-container"
    >
        <i class="miniplayer-icon fa-solid fa-heart" />
    </div>

    <div
        class="miniplayer-player-icon-container miniplayer-player-more-container"
        on:click={openMenu}
    >
        <i
            class="miniplayer-icon fa-solid fa-angles-{fullscreen
                ? 'right'
                : 'left'}"
        />
        {#if contextMenuOpen}
            <SongEntryMenu
                songData={songInfo}
                closeCallback={closeMenu}
                opacity={contextMenuOpacity}
                top={true}
                left={!fullscreen}
            />
        {/if}
    </div>

    <!-- ----------- -->

    <!-- Fullscreen-only bottom icons -->

    <div
        class="miniplayer-player-icon-container miniplayer-player-clear-mode-container"
        on:click={setViewClear}
        style="opacity: {fullscreen ? '1' : '0'}; visibility: {fullscreen
            ? 'visible'
            : 'hidden'};"
    >
        <i class="miniplayer-icon fa-solid fa-image" />
    </div>

    <div
        class="miniplayer-player-icon-container miniplayer-player-lyrics-mode-container"
        on:click={setViewLyrics}
        style="opacity: {fullscreen ? '1' : '0'}; visibility: {fullscreen
            ? 'visible'
            : 'hidden'};"
    >
        <i class="miniplayer-icon fa-solid fa-bars" />
    </div>

    <!-- ----------- -->

    <!-- Fullscreen modes -->
    {#if fullscreen}
        {#if fullscreenViewMode == 1}
            <!-- Lyrics mode -->

            <div class="miniplayer-side-view-container">
                <Lyrics lyrics={currentSongLyrics} />
            </div>
        {/if}
    {/if}

    <!-- ----------- -->

    <div class="miniplayer-player-container">
        <!-- Left container of the miniplayer (Art, details) -->

        <div class="miniplayer-player-left-container">
            <div class="miniplayer-player-album-container">
                <img
                    class="miniplayer-player-album-cover"
                    src="broken"
                    id="cover"
                />
                <div
                    class="miniplayer-player-album-cover miniplayer-player-album-cover-missing"
                    id="coverMissing"
                    style="visibility:none;"
                ></div>
            </div>

            <div class="miniplayer-song-info-container">
                <p class="miniplayer-text miniplayer-song-title" id="title">
                    {currentSongData.title}
                </p>
                <p class="miniplayer-text miniplayer-song-artist" id="artist">
                    {currentSongData.artist}
                </p>
                <p class="miniplayer-text miniplayer-song-album" id="album">
                    {currentSongData.album}
                </p>
            </div>
        </div>

        <!-- ----------- -->

        <!-- Right container of the miniplayer (Seek, play, next, prev) -->

        <div class="miniplayer-player-right-container">
            <div class="miniplayer-progress-container">
                <div
                    class="miniplayer-time miniplayer-time-elapsed"
                    id="elapsed"
                >
                    {prettyTime(currentSongData.elapsedSeconds)}
                </div>
                <div class="miniplayer-time miniplayer-time-total" id="total">
                    {prettyTime(currentSongData.totalSeconds)}
                </div>
                <div class="miniplayer-progress-input-container"></div>
                <div
                    class="miniplayer-progress miniplayer-progress-background"
                    id="progress-background"
                ></div>
                <div
                    class="miniplayer-progress miniplayer-progress-foreground"
                    id="progress-foreground"
                    style={seeking ? "transition: none" : ""}
                ></div>
            </div>
            <div class="miniplayer-nav-container">
                <div class="miniplayer-icon-container" on:click={playPrevious}>
                    <i class="miniplayer-icon fa-solid fa-backward-step"></i>
                </div>
                <div class="miniplayer-icon-container">
                    <PausePlay
                        icon="fa-solid {currentSongData.playing
                            ? 'fa-pause'
                            : 'fa-play'}"
                        callback={currentSongData.playing
                            ? pausePlayback
                            : resumePlayback}
                    />
                </div>
                <div class="miniplayer-icon-container" on:click={playNext}>
                    <i class="miniplayer-icon fa-solid fa-forward-step"></i>
                </div>
            </div>
        </div>

        <!-- ----------- -->
    </div>
</div>

<!-- Conditional stylesheets for fullscreen mode. -->

{#if fullscreen}
    {#if fullscreenViewMode == 0}
        <style>
            .miniplayer-player-container {
                top: 50%;
                transform: translateY(-50%) translateX(-50%);
                left: 50%;
            }
        </style>
    {:else}
        <style>
            .miniplayer-player-container {
                top: 50%;
                transform: translateY(-50%);
                left: calc(45% - 25rem);
            }
        </style>
    {/if}

    <style>
        .miniplayer-side-view-container {
            left: 55%;
            width: 40%;
            height: 70%;
            top: 15%;
            position: absolute;
            display: block;
            overflow-x: hidden;
            overflow-y: auto;
        }

        .miniplayer-container {
            bottom: unset;
            left: 0;
            bottom: 0;
            width: 100%;
            height: 100%;
            border-top-left-radius: 0;
            border-top-right-radius: 0;
            overflow: hidden;
        }

        .miniplayer-player-favorite-container {
            left: 4rem;
            top: calc(100% - 2.5rem);
        }

        .miniplayer-player-volume-container {
            right: 4rem;
            top: calc(100% - 2.5rem);
        }

        .miniplayer-player-clear-mode-container {
            left: calc(50% - 1.5rem);
            top: calc(100% - 2.5rem);
            transform: translateX(-50%);
        }

        .miniplayer-player-lyrics-mode-container {
            left: calc(50% + 1.5rem);
            top: calc(100% - 2.5rem);
            transform: translateX(-50%);
        }

        .miniplayer-player-left-container {
            position: relative;
            display: flex;
            width: 25rem;
            max-width: 25rem;
            height: auto;
            flex-direction: column;
        }

        .miniplayer-player-container {
            height: auto;
            flex-direction: column;
        }

        .miniplayer-player-album-container {
            width: 25rem;
            height: 25rem;
            min-width: 25rem;
        }

        .miniplayer-song-info-container {
            width: 100%;
        }

        .miniplayer-text {
            text-align: center;
            font-size: 1.1rem;
        }

        .miniplayer-song-title {
            font-size: 1.1rem;
            text-align: center;
        }

        .miniplayer-song-artist {
            font-size: 1rem;
            text-align: center;
        }

        .miniplayer-song-album {
            font-size: 1rem;
            text-align: center;
        }

        .miniplayer-player-right-container {
            height: 5rem;
            transform: translateY(50%);
            margin-bottom: 7rem;
        }
    </style>
{/if}

{#if !fullscreen}
    <style>
        .miniplayer-container {
            bottom: 0;
            left: 50%;
            width: 40rem;
            height: 6rem;
            transform: translateX(-50%);
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
            border-top: solid var(--vm-miniplayer-border) 1px;
            border-left: solid var(--vm-miniplayer-border) 1px;
            border-right: solid var(--vm-miniplayer-border) 1px;
        }

        .miniplayer-player-favorite-container {
            left: 2rem;
            top: 1.5rem;
        }

        .miniplayer-player-volume-container {
            right: 2rem;
            top: 1.5rem;
        }

        .miniplayer-player-left-container {
            position: relative;
            display: flex;
            width: 15rem;
            max-width: 15rem;
            flex-direction: row;
        }

        .miniplayer-player-container {
            bottom: 0;
            left: 50%;
            height: 100%;
            transform: translateX(-50%);
            flex-direction: row;
        }

        .miniplayer-player-album-container {
            width: 4rem;
            height: 4rem;
            min-width: 4rem;
        }

        .miniplayer-song-info-container {
            width: 10rem;
        }

        .miniplayer-text {
            text-align: left;
            max-width: 100%;
        }

        .miniplayer-song-title {
            font-size: 0.8rem;
        }

        .miniplayer-song-artist {
            font-size: 0.7rem;
        }

        .miniplayer-song-album {
            font-size: 0.7rem;
        }

        .miniplayer-player-right-container {
            transform: translateY(47%);
            height: 100%;
            margin-bottom: 0rem;
        }

        .miniplayer-side-view-container {
            display: none;
        }
    </style>
{/if}

<!-- ----------- -->

<!-- Static stylesheet -->

<style>
    .miniplayer-container {
        position: absolute;
        background-color: var(--vm-miniplayer-background);

        z-index: 100;
        backdrop-filter: saturate(150%) blur(50px);
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-player-container {
        display: flex;
        position: absolute;
        justify-items: center;
        align-items: center;
        transition: 0.2s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-player-right-container {
        position: relative;
        display: block;
        flex-direction: column;
        gap: 0.5rem;
        width: 15rem;
    }

    .miniplayer-player-left-container {
        gap: 0.5rem;
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-icon-container {
        position: relative;
        display: inline-block;
        width: 2rem;
        height: 2rem;
        cursor: pointer;
    }

    .miniplayer-icon {
        display: block;
        position: absolute;
        font-size: 1rem;
        transform: translateX(-50%) translateY(-50%);
        left: 50%;
        top: 50%;
        color: var(--vm-panel-font-base);
        transition: 0.1s ease-in;
    }

    .miniplayer-player-volume-container:hover > .miniplayer-icon,
    .miniplayer-player-favorite-container:hover > .miniplayer-icon,
    .miniplayer-player-more-container:hover > .miniplayer-icon,
    .miniplayer-player-fullscreen-container:hover > .miniplayer-icon,
    .miniplayer-player-clear-mode-container:hover > .miniplayer-icon,
    .miniplayer-player-lyrics-mode-container:hover > .miniplayer-icon,
    .miniplayer-icon-container:hover > .miniplayer-icon {
        color: var(--vm-panel-font-highlight-mid);
    }

    .miniplayer-progress-container {
        display: block;
        position: relative;
        width: 15rem;
        height: 0.11rem;
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-progress-input-container {
        display: block;
        position: absolute;
        width: 100%;
        height: 300%;
        top: -100%;
        left: 0;
        cursor: pointer;
    }

    .miniplayer-progress {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
        border-radius: 0.1rem;
        height: 0.11rem;
    }

    .miniplayer-progress-background {
        background-color: var(--vm-miniplayer-progress-background);
        z-index: 101;
        cursor: pointer;
    }

    .miniplayer-progress-foreground {
        background-color: var(--vm-miniplayer-progress);
        z-index: 102;
        width: 50%;
        transition: 0.2s ease-in-out;
        cursor: pointer;
    }

    .miniplayer-progress-foreground:hover,
    .miniplayer-progress-input-container:hover
        + .miniplayer-progress-foreground,
    .miniplayer-progress-container:hover > .miniplayer-progress-foreground,
    .miniplayer-progress-background:hover + .miniplayer-progress-foreground,
    .miniplayer-progress:hover > .miniplayer-progress-foreground {
        height: 0.3rem;
    }

    .miniplayer-nav-container {
        display: flex;
        position: relative;
        width: 15rem;
        align-items: center;
        align-content: center;
        flex-direction: row;
        justify-content: center;
        justify-items: center;
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-song-info-container {
        display: flex;
        position: relative;
        flex-direction: column;
        justify-content: center;
        align-content: center;
    }

    .miniplayer-text {
        font-family: var(--vm-panel-font-regular);
        color: var(--vm-panel-font-base);
        padding: 0;
        margin: 0;
        text-overflow: ellipsis;
        overflow: hidden;
        white-space: nowrap;
        user-select: none;
    }

    .miniplayer-song-artist {
        font-style: italic;
        color: #ccc;
    }

    .miniplayer-song-album {
        font-style: italic;
        color: #ccc;
    }

    .miniplayer-player-album-container {
        display: block;
        position: relative;
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-player-album-cover {
        position: absolute;
        width: 100%;
        height: 100%;
        border: #444444 1px solid;
        border-radius: 0.5rem;
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-player-album-cover-missing {
        background-color: #222222;
        transition: 0.6s cubic-bezier(0.23, 0.65, 0.27, 1);
    }

    .miniplayer-time {
        position: absolute;
        display: block;
        font-family: var(--vm-panel-font-regular);
        color: var(--vm-panel-font-base);
        font-size: 0.7rem;
        top: -1rem;
        user-select: none;
    }

    .miniplayer-time-elapsed {
        left: 0;
    }

    .miniplayer-time-total {
        right: 0;
    }

    .miniplayer-player-icon-container {
        position: absolute;
        display: block;
        width: 1rem;
        height: 1rem;
        cursor: pointer;
    }

    .miniplayer-player-fullscreen-container {
        right: 2rem;
        bottom: 1.5rem;
    }

    .miniplayer-player-favorite-container {
        transition: 0.5s cubic-bezier(0.12, 0.67, 0.12, 0.99);
    }

    .miniplayer-player-more-container {
        left: 2rem;
        bottom: 1.5rem;
    }

    .miniplayer-player-volume-container {
        transition: 0.5s cubic-bezier(0.12, 0.67, 0.12, 0.99);
    }

    .miniplayer-player-volume-container .miniplayer-volume-bar-container {
        visibility: hidden;
        opacity: 0;
    }

    .miniplayer-player-volume-container:hover .miniplayer-volume-bar-container {
        visibility: visible;
        opacity: 1;
    }

    .miniplayer-volume-bar-container {
        position: absolute;
        display: block;
        bottom: 1.5em;
        left: 50%;
        transform: translateX(-50%);
        height: 10rem;
        width: 3rem;
        z-index: 101;
        background-color: transparent;
        transition: 0.1s ease-in-out;
    }

    .miniplayer-volume-bar-container-inner {
        position: absolute;
        display: block;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        height: 10rem;
        width: 2rem;
        background: var(--vm-miniplayer-background);
        border: solid var(--vm-miniplayer-border) 1px;
        border-radius: 0.5rem;
        backdrop-filter: saturate(150%) blur(50px); /* TODO: why is this broken? */
    }

    .miniplayer-volume-bar-container-inner-2 {
        position: absolute;
        display: block;
        width: 100%;
        height: calc(100% - 1rem);
        bottom: 0.5rem;
        left: 50%;
        transform: translateX(-50%);
    }

    .miniplayer-volume-bar {
        position: absolute;
        display: block;
        left: 50%;
        transform: translateX(-50%);
        border-radius: 0.2rem;
        bottom: 0rem;
        width: 0.3rem;
        height: 100%;
        transition: none;
    }

    .miniplayer-volume-bar-background {
        background-color: var(--vm-miniplayer-progress-background);
    }

    .miniplayer-volume-bar-foreground {
        height: 50%;
        background-color: var(--vm-miniplayer-progress);
        z-index: 101;
    }

    /* Fullscreen-only icons */
    .miniplayer-player-clear-mode-container,
    .miniplayer-player-lyrics-mode-container {
        transition: 0.5s cubic-bezier(0.12, 0.67, 0.12, 0.99);
    }
</style>
