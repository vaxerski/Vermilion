<script lang="ts">
    import { currentPage } from "../../../state/sharedState.svelte";
    import SongEntry from "./SongEntry.svelte";
    import SongEntryBreaker from "./songEntry/SongEntryBreaker.svelte";

    let {
        songs /* Array<SongDataShort> */ = [],
        playlist /* PlaylistDataShort */ = null,
        placeholder = "Such empty...",
        queue = false,
        propagateSongs = false,
        queueBreaker = -1,
    } = $props();

    if (playlist != null) {
        window.electron.ipcRenderer.send("getPlaylistData", { ...playlist });

        propagateSongs = true;
    }

    window.electronAPI.reloadPlaylist((res) => {
        if (playlist == null) return;

        if (res.identifier != playlist.identifier) return;

        if (
            currentPage.page !=
            "/playlists/playlist/" + playlist.source + "_" + playlist.identifier
        )
            return;

        window.electron.ipcRenderer.send("getPlaylistData", { ...playlist });

        propagateSongs = true;
    });

    window.electronAPI.playlistData((res) => {
        if (playlist != null && res.name != playlist.name) return;

        songs = res.songs;
    });
</script>

<div class="song-list-container">
    <div class="song-list-legend">
        <p class="song-list-text song-list-number">#</p>
        <p class="song-list-text song-list-title">Title</p>
        <p class="song-list-text song-list-artist">Artist</p>
        <p class="song-list-text song-list-album">Album</p>
        <p class="song-list-text song-list-duration">Duration</p>
    </div>
    <hr class="song-list-top-hr" />
    {#each songs as song, i}
        {#if queueBreaker != -1 && queueBreaker == i}
            <SongEntryBreaker text="More from the playlist..." />
        {/if}
        {#if song != null}
            <SongEntry
                title={song.title}
                artistString={song.artistString}
                album={song.album}
                artistList={song.artists ? song.artists : []}
                albumId={song.albumId ? song.albumId : ""}
                duration={song.duration}
                alternate={i % 2 == 1 ? true : false}
                identifier={song.identifier}
                source={song.source}
                index={i + 1}
                songs={propagateSongs ? songs : []}
                {playlist}
                {queue}
            />
        {/if}
    {/each}
    {#if songs.length == 0}
        <div class="song-placeholder-container">
            <p class="song-placeholder-text">
                {placeholder}
            </p>
        </div>
    {/if}
</div>

<style>
    .song-list-legend {
        display: block;
        width: 100%;
        height: 1rem;
    }

    .song-list-text {
        display: block;
        position: absolute;
        color: #e7e7e7;
        font-size: 0.7rem;
        font-style: italic;
        opacity: 0.7;
    }

    .song-list-number {
        left: 2.4%;
    }

    .song-list-title {
        left: calc(2.5% + 1rem);
        max-width: 43%;
    }

    .song-list-artist {
        left: 50%;
    }

    .song-list-album {
        left: 65%;
    }

    .song-list-duration {
        right: 5%;
    }

    .song-list-top-hr {
        width: 95%;
        height: 1px;
        max-height: 1px;
        background: var(--vm-panel-font-hr);
        margin: 0.5rem 0rem;
        margin-left: 2.5%;
        border: none;
    }

    .song-list-container {
        display: block;
        position: relative;
        border-radius: 1rem;
        padding: 0.5rem 0rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        margin-bottom: 1rem;
    }

    .song-placeholder-container {
        display: block;
        position: relative;
        width: 100%;
        margin: 0.5rem;
        height: 1rem;
        margin-top: 1rem;
    }

    .song-placeholder-text {
        display: block;
        position: absolute;
        color: #e7e7e799;
        font-size: 0.7rem;
        font-style: italic;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
    }
</style>
