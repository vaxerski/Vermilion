<script lang="ts">
    import { type PlaylistDataShort } from "../../../../../../main/types/playlistDataShort";
    import { currentPage } from "../../../state/sharedState.svelte";

    let { playlist /* PlaylistDataShort */, alternate, index } = $props();

    function prettyTime(time: number) {
        if (time <= 0) return "0:00";
        let mins: number = Math.floor(time / 60);
        let secs: number = Math.floor(time - mins * 60);
        if (mins > 60) {
            let hrs = Math.floor(mins / 60);
            mins -= hrs * 60;
            return (
                hrs +
                ":" +
                (mins > 9 ? mins : "0" + mins) +
                ":" +
                (secs > 9 ? secs : "0" + secs)
            );
        }
        return secs > 9 ? mins + ":" + secs : mins + ":0" + secs;
    }

    let currentlyPlaying = $state(false);
    let currentStatePlaying = $state(false);

    window.electronAPI.updateCurrentSong((res) => {
        currentlyPlaying = res.playlist == playlist.name;
        currentStatePlaying = res.playing;
    });

    function onEnter() {
        currentPage.page =
            "/playlists/playlist/" +
            playlist.source +
            "_" +
            playlist.identifier;
    }

    let wantsToPlay = false;

    window.electronAPI.playlistData((res) => {
        if (res.name != playlist.name || !wantsToPlay) return;

        window.electron.ipcRenderer.send("playSong", {
            identifier: res.songs[0].identifier,
            source: res.source,
            index: 0,
            playlist: res.source + "_" + res.identifier,
        });

        wantsToPlay = false;
    });

    function onPlay() {
        window.electron.ipcRenderer.send("getPlaylistData", { ...playlist });
        wantsToPlay = true;
    }
</script>

<div
    class="playlist-entry-container {alternate
        ? 'playlist-entry-container-alt'
        : ''}"
>
    <i
        class="playlist-entry-text playlist-entry-icon fa-solid {currentlyPlaying &&
        currentStatePlaying
            ? 'fa-pause'
            : 'fa-play'}"
        on:click={onPlay}
        style={currentlyPlaying ? "opacity:1;" : ""}
    >
    </i>
    <p
        class="playlist-entry-text playlist-entry-index"
        style={currentlyPlaying ? "opacity:0;" : ""}
    >
        {index}
    </p>
    <p
        class="playlist-entry-text playlist-entry-title {currentlyPlaying
            ? 'playlist-entry-playing'
            : ''}"
        on:click={onEnter}
    >
        {playlist.name}
    </p>
    <p class="playlist-entry-text playlist-entry-songs">
        {playlist.songsNumber}
    </p>
    <p class="playlist-entry-text playlist-entry-source">
        {#if playlist.source == "mpd"}
            <i class="fa-solid fa-music" />
        {/if}
        {#if playlist.source == "tidal"}
            <img
                class="playlist-entry-text-svg"
                src="../../resources/tidalWhite.svg"
            />
        {/if}
    </p>
    <p class="playlist-entry-text playlist-entry-duration">
        {prettyTime(playlist.duration)}
    </p>
</div>

<style>
    .playlist-entry-container {
        display: block;
        position: relative;
        width: 100%;
        height: 2rem;
        padding: 0;
        margin: 0;
    }

    .playlist-entry-container-alt {
        background: linear-gradient(
            90deg,
            rgba(68, 68, 68, 0) 0%,
            rgba(68, 68, 68, 0.13) 10%,
            rgba(68, 68, 68, 0.13) 90%,
            rgba(68, 68, 68, 0) 100%
        );
    }

    .playlist-entry-text {
        display: block;
        position: absolute;
        color: var(--vm-panel-font-base);
        font-size: 0.8rem;
        opacity: 0.9;
        top: 50%;
        transform: translateY(-50%);
        text-overflow: ellipsis;
        overflow: hidden;
        text-wrap: nowrap;
        user-select: none;
        transition: 0.1s ease-in-out;
    }

    .playlist-entry-playing {
        color: var(--vm-panel-font-highlight-mid);
    }

    .playlist-entry-icon {
        right: 96.2%;
        transition: 0.07s ease-in;
        cursor: pointer;
        opacity: 0;
        z-index: 11;
        width: 2.4%;
        text-align: center;
        text-overflow: clip;
    }

    .playlist-entry-index {
        right: 96.2%;
        transition: 0.07s ease-in;
        color: var(--vm-panel-font-base);
        width: 2.4%;
        text-align: center;
        text-overflow: clip;
        opacity: 0.5;
    }

    .playlist-entry-container:hover > .playlist-entry-icon {
        opacity: 1;
    }

    .playlist-entry-container:hover > .playlist-entry-index {
        opacity: 0;
    }

    .playlist-entry-icon:hover {
        color: var(--vm-panel-font-highlight-mid);
    }

    .playlist-entry-title {
        left: calc(2.5% + 1rem);
        max-width: 43%;
    }

    .playlist-entry-title:hover {
        text-decoration: underline;
        color: var(--vm-panel-font-highlight-mid);
        cursor: pointer;
    }

    .playlist-entry-songs {
        left: 65%;
        max-width: 14%;
    }

    .playlist-entry-source {
        left: 80%;
        max-width: 14%;
    }

    .playlist-entry-duration {
        right: 5%;
    }

    .playlist-entry-text-svg {
        width: 1.2rem;
        transform: translateY(8.5%);
    }
</style>
