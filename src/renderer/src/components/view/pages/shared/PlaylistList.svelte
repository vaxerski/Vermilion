<script lang="ts">
    import type { PlaylistDataShort } from "../../../../../../main/types/playlistDataShort";
    import PlaylistEntry from "./PlaylistEntry.svelte";

    let { playlists /* Array<PlaylistDataShort> */, placeholder = "Such empty..." } = $props();
</script>

<div class="playlist-list-container">
    <div class="playlist-list-legend">
        <p class="playlist-list-text playlist-list-number">
            #
        </p>
        <p class="playlist-list-text playlist-list-title">
            Name
        </p>
        <p class="playlist-list-text playlist-list-songs">
            Songs
        </p>
        <p class="playlist-list-text playlist-list-source">
            Source
        </p>
        <p class="playlist-list-text playlist-list-duration">
            Duration
        </p>
    </div>
    <hr class="playlist-list-top-hr"/>
    {#each playlists as playlist, i}
        <PlaylistEntry playlist={playlist} alternate={i % 2 == 1 ? true : false} index={i + 1} />
    {/each}
    {#if playlists.length == 0}
        <div class="playlist-placeholder-container">
            <p class="playlist-placeholder-text">
                {placeholder}
            </p>
        </div>
    {/if}
</div>

<style>
    .playlist-list-legend {
        display: block;
        width: 100%;
        height: 1rem;
    }

    .playlist-list-text {
        display: block;
        position: absolute;
        color: #e7e7e7;
        font-size: 0.7rem;
        font-style: italic;
        opacity: 0.7;
    }

    .playlist-list-number {
        left: 2.4%;
    }

    .playlist-list-title {
        left: calc(2.5% + 1rem);
        max-width: 43%;
    }

    .playlist-list-songs {
        left: 65%;
    }

    .playlist-list-source {
        left: 80%;
    }

    .playlist-list-duration {
        right: 5%
    }

    .playlist-list-top-hr {
        width: 95%;
        height: 1px;
        max-height: 1px;
        background: var(--vm-panel-font-hr);
        margin: 0.5rem 0rem;
        margin-left: 2.5%;
        border: none;
    }

    .playlist-list-container {
        display: block;
        position: relative;
        border-radius: 1rem;
        padding: 0.5rem 0rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
    }

    .playlist-placeholder-container {
        display: block;
        position: relative;
        width: 100%;
        margin: 0.5rem;
        height: 1rem;
        margin-top: 1rem;
    }

    .playlist-placeholder-text {
        display: block;
        position: absolute;
        color: #e7e7e799;
        font-size: 0.7rem;
        font-style: italic;
        left: 50%;
        top:50%;
        transform: translateX(-50%) translateY(-50%);
    }
</style>
