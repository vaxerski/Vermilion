<script lang="ts">
    import type { PlaylistDataShort } from "../../../../../../main/types/playlistDataShort";

    let {
        closeCallback,
        addToQueueCallback,
        addAsNextCallback,
        removeFromQueueCallback,
        removeFromPlaylistCallback,
        addToPlaylistCallback,
        opacity = 0,
        left = true,
        top = false,
        queue = false,
        playlist = false,
        source = "",
    } = $props();

    let addingToPlaylist = $state(false);

    function setAddingToPlaylist() {
        addingToPlaylist = !addingToPlaylist;
        if (addingToPlaylist)
            window.electron.ipcRenderer.send("gatherPlaylists");
    }

    function addToPlaylist(playlist) {
        addToPlaylistCallback($state.snapshot(playlist));
    }

    addEventListener("mousedown", (e) => {
        const CONTAINER = document.getElementById("contextMenuContainer");

        if (CONTAINER == null) return;

        const BB = CONTAINER.getBoundingClientRect();

        if (
            e.clientX > BB.x + BB.width ||
            e.clientX < BB.x ||
            e.clientY > BB.y + BB.height ||
            e.clientY < BB.y
        )
            closeCallback();
    });

    addEventListener("keydown", (e) => {
        if (e.key == "Escape") closeCallback();
    });

    let playlists: Array<PlaylistDataShort> = $state([]);

    window.electronAPI.updatePlaylists((msg /* Array<PlaylistData> */) => {
        console.log("playlists");
        playlists = msg;
    });

    // THIS DOESN'T WORK BECAUSE SONGDATA IS NOT UPDATED PROPERLY AS THE LIST CHANGES AAAAAAAAAAAAAAAAAAAA
    // function addToQueue() {
    //     window.electron.ipcRenderer.send("addToQueue", $state.snapshot(songData));
    //     closeCallback();
    // }
</script>

<div
    class="song-context-menu-container"
    id="contextMenuContainer"
    style="opacity: {opacity}; {top ? 'bottom' : 'top'}: 1rem; {left
        ? 'right'
        : 'left'}: 1.5rem;"
>
    {#if addingToPlaylist}
        <div class="song-context-menu-option" onclick={setAddingToPlaylist}>
            <i class="song-context-menu-icon fa-solid fa-arrow-left"></i>
            <p class="song-context-menu-text">Back</p>
        </div>
        {#each playlists as playlist}
            {#if source == playlist.source}
                <div
                    class="song-context-menu-option"
                    onclick={() => {addToPlaylist(playlist)}}
                >
                    <i class="song-context-menu-icon fa-solid fa-music"></i>
                    <p class="song-context-menu-text">{playlist.name}</p>
                </div>
            {/if}
        {/each}
    {:else}
        {#if queue}
            <div
                class="song-context-menu-option"
                onclick={removeFromQueueCallback}
            >
                <i class="song-context-menu-icon fa-solid fa-xmark"></i>
                <p class="song-context-menu-text">Remove from queue</p>
            </div>
        {/if}
        {#if !queue}
            <div class="song-context-menu-option" onclick={addToQueueCallback}>
                <i class="song-context-menu-icon fa-solid fa-plus"></i>
                <p class="song-context-menu-text">Add to queue</p>
            </div>
            <div class="song-context-menu-option" onclick={addAsNextCallback}>
                <i class="song-context-menu-icon fa-solid fa-plus"></i>
                <p class="song-context-menu-text">Add as next</p>
            </div>
            <div class="song-context-menu-option">
                <i class="song-context-menu-icon fa-solid fa-music"></i>
                <p class="song-context-menu-text">Play now</p>
            </div>
        {/if}
        {#if playlist}
            <div
                class="song-context-menu-option"
                onclick={removeFromPlaylistCallback}
            >
                <i class="song-context-menu-icon fa-solid fa-minus"></i>
                <p class="song-context-menu-text">Remove from playlist</p>
            </div>
        {/if}
        <div class="song-context-menu-option" onclick={setAddingToPlaylist}>
            <i class="song-context-menu-icon fa-solid fa-bars"></i>
            <p class="song-context-menu-text">Add to playlist</p>
        </div>
        <div class="song-context-menu-option">
            <i class="song-context-menu-icon fa-solid fa-star"></i>
            <p class="song-context-menu-text">Add to favorites</p>
        </div>
    {/if}
</div>

<style>
    .song-context-menu-container {
        position: absolute;
        display: flex;
        flex-direction: column;
        width: 12rem;
        height: auto;
        max-height: 24rem;
        overflow-x: hidden;
        overflow-y: auto;
        padding: 0.5rem 0rem;
        z-index: 50;
        background-color: #33333333;
        border: 1px solid #44444444;
        border-radius: 0.5rem;
        backdrop-filter: saturate(150%) blur(50px);
        opacity: 0;
        transition: 0.1s ease-in;
        gap: 0.3rem;
    }

    .song-context-menu-option {
        cursor: pointer;
        position: relative;
        display: block;
        width: 100%;
        height: 1.2rem;
        min-height: 1.2rem;
        max-height: 1.2rem;
        background-color: #77777700;
        transition: 0.09s ease-in-out;
        border-radius: 0.25rem;
        padding-left: 0.3rem;
        padding-right: 1rem;
    }

    .song-context-menu-option:hover {
        background-color: #77777733;
    }

    .song-context-menu-text {
        font-family: var(--vm-panel-font-regular);
        color: #e9e9e9;
        font-size: 0.8rem;
        position: absolute;
        top: 50%;
        left: 1.7rem;
        transform: translateY(-50%);
    }

    .song-context-menu-icon {
        color: #e9e9e9;
        font-size: 0.8rem;
        position: absolute;
        top: 50%;
        left: 0.5rem;
        transform: translateY(-50%);
    }
</style>
