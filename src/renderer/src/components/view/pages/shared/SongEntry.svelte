<script lang="ts">
    import type { SongDataShort } from "../../../../../../main/types/songData";
    import { changePageTo } from "../../../state/sharedState.svelte";
    import ArtistEntry from "./songEntry/ArtistEntry.svelte";
    import SongEntryMenu from "./SongEntryMenu.svelte";

    let {
        title = "",
        artistString = "",
        artistList = [],
        album = "",
        albumId = "",
        duration = 0,
        alternate = false,
        identifier = "",
        source = "",
        index = 0,
        queue = false,
        songs = [],
    } = $props();

    function prettyTime(time: number) {
        if (time <= 0) return "0:00";
        let mins: number = Math.floor(time / 60);
        let secs: number = Math.floor(time - mins * 60);
        return secs > 9 ? mins + ":" + secs : mins + ":0" + secs;
    }

    function onPlay() {
        if (currentlyPlaying) {
            if (currentStatePlaying)
                window.electron.ipcRenderer.send("pausePlayback");
            else window.electron.ipcRenderer.send("resumePlayback");
            return;
        }

        if (identifier == "" || source == "") {
            console.log("Cannot play, invalid song?");
            return;
        }
        window.electron.ipcRenderer.send("playSong", {
            identifier: identifier,
            source: source,
            index:
                index -
                1 /* index for queue is 0 based, while here it's 1 based for the user. */,
            queue: queue,
            songs: songs.length == 0 ? undefined : $state.snapshot(songs),
        });
    }

    let currentlyPlaying = $state(false);
    let currentStatePlaying = $state(false);
    let contextMenuOpen = $state(false);
    let contextMenuOpacity = $state(0);

    window.electronAPI.updateCurrentSong((res) => {
        currentlyPlaying =
            title == res.title && album == res.album && artist == res.artist;
        currentStatePlaying = res.playing;
    });

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

    function addToQueue() {
        const songInfo: SongDataShort = {
            title: title,
            artistString: artistString,
            artists: artistList,
            album: album,
            identifier: identifier,
            source: source,
            duration: duration,
        };
        window.electron.ipcRenderer.send("addToQueue", songInfo);
        closeMenu();
    }

    function removeFromQueue() {
        const songInfo: SongDataShort = {
            title: title,
            artistString: artistString,
            artists: artistList,
            album: album,
            identifier: identifier,
            source: source,
            duration: duration,
            index:
                index -
                1 /* index for queue is 0 based, while here it's 1 based for the user. */,
        };
        window.electron.ipcRenderer.send("removeFromQueue", songInfo);
        closeMenu();
    }

    function clickedAlbum() {
        if (!albumId || albumId == "") return;

        changePageTo("/" + source + "/album/" + albumId);
    }
</script>

<div
    class="song-entry-container {alternate ? 'song-entry-container-alt' : ''}"
    id="songEntryContainer"
>
    <i
        class="song-entry-text song-entry-icon fa-solid {currentlyPlaying &&
        currentStatePlaying
            ? 'fa-pause'
            : 'fa-play'}"
        on:click={onPlay}
        style={currentlyPlaying ? "opacity:1;" : ""}
    >
    </i>
    <p
        class="song-entry-text song-entry-index"
        style={currentlyPlaying ? "opacity:0;" : ""}
    >
        {index}
    </p>
    <p
        class="song-entry-text song-entry-title {currentlyPlaying
            ? 'song-entry-playing'
            : ''}"
    >
        {title}
    </p>
    
        {#if artistList.length != 0}
        <div class="song-entry-artist-multi-box">
            {#each artistList as artist, i}
                <ArtistEntry
                    name={artist.name}
                    identifier={artist.identifier}
                    source={artist.source}
                />
                {#if i != artistList.length - 1},&nbsp;
                {/if}
            {/each}
        </div>
        {:else}
        <p class="song-entry-text song-entry-artist">
            {artistString}
        </p>
        {/if}
    
    <p
        class="song-entry-text song-entry-album {albumId != ''
            ? 'song-entry-clickable'
            : ''}"
        on:click={clickedAlbum}
    >
        {album}
    </p>
    <p class="song-entry-text song-entry-duration">
        {prettyTime(duration)}
    </p>
    <i
        class="song-entry-text song-entry-options fa-solid fa-ellipsis"
        id="songEntryIcon"
        on:click={openMenu}
    >
    </i>
    {#if contextMenuOpen}
        <SongEntryMenu
            addToQueueCallback={addToQueue}
            closeCallback={closeMenu}
            opacity={contextMenuOpacity}
            removeFromQueueCallback={removeFromQueue}
            {queue}
        />
    {/if}
</div>

<style>
    .song-entry-container {
        display: block;
        position: relative;
        width: 100%;
        height: 2rem;
        padding: 0;
        margin: 0;
    }

    .song-entry-container-alt {
        background: linear-gradient(
            90deg,
            rgba(68, 68, 68, 0) 0%,
            rgba(68, 68, 68, 0.13) 10%,
            rgba(68, 68, 68, 0.13) 90%,
            rgba(68, 68, 68, 0) 100%
        );
    }

    .song-entry-text {
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

    .song-entry-playing {
        color: var(--vm-panel-font-highlight-mid);
    }

    .song-entry-icon {
        right: 96.2%;
        transition: 0.07s ease-in;
        cursor: pointer;
        opacity: 0;
        z-index: 11;
        width: 2.4%;
        text-align: center;
        text-overflow: clip;
    }

    .song-entry-index {
        right: 96.2%;
        transition: 0.07s ease-in;
        color: var(--vm-panel-font-base);
        width: 2.4%;
        text-align: center;
        text-overflow: clip;
        opacity: 0.5;
    }

    .song-entry-container:hover > .song-entry-icon {
        opacity: 1;
    }

    .song-entry-container:hover > .song-entry-index {
        opacity: 0;
    }

    .song-entry-icon:hover {
        color: var(--vm-panel-font-highlight-mid);
    }

    .song-entry-options {
        right: 1%;
        transition: 0.07s ease-in;
        cursor: pointer;
        z-index: 11;
        width: 2.4%;
        text-align: center;
        text-overflow: clip;
    }

    .song-entry-options:hover {
        color: var(--vm-panel-font-highlight-mid);
    }

    .song-entry-title {
        left: calc(2.5% + 1rem);
        max-width: 43%;
    }

    .song-entry-artist {
        left: 50%;
        max-width: 14%;
    }

    .song-entry-artist-multi-box {
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
        left: 50%;
        max-width: 14%;
        width: 14%;
    }

    .song-entry-album {
        left: 65%;
        max-width: 22%;
    }

    .song-entry-duration {
        right: 5%;
    }

    .song-entry-clickable {
        transition: 0.15s ease-in;
        cursor: pointer;
    }

    .song-entry-clickable:hover {
        text-decoration: underline;
        color: var(--vm-panel-font-highlight-mid);
    }
</style>
