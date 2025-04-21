<script lang="ts">
    import PageTitle from "../shared/PageTitle.svelte";
    import SongList from "../shared/SongList.svelte";

    import type { AlbumData } from "../../../../../../main/types/albumData";
    import PageImageTitle from "./PageImageTitle.svelte";

    let { identifier, source } = $props();

    let currentAlbumData: AlbumData = $state({
        name: "Loading...",
        source: source,
        identifier: "",
        artist: "Fetching from Tidal...",
        songs: []
    });

    window.electronAPI.albumData((msg /* AlbumData */) => {
        if (msg.identifier != identifier) return;

        if (msg.name == "") msg.name = "Album";

        currentAlbumData = msg;
    });

    function updateAlbumData() {
        window.electron.ipcRenderer.send("getAlbumData", {
            identifier: identifier,
            source: "tidal",
        });
    }

    updateAlbumData();
</script>

<PageImageTitle
    imageURL={currentAlbumData.coverUrl ? currentAlbumData.coverUrl : ""}
    imageBig={true}
    text={currentAlbumData.name}
    subtext={currentAlbumData.artist}
    year={currentAlbumData.year ? currentAlbumData.year : ""}
    infotext="Vermilion is not associated with Tidal or Tidal Music AS."
/>

<SongList songs={currentAlbumData.songs} placeholder="Loading..." propagateSongs={true} />

<div class="album-page-bottom-data">
{#if currentAlbumData.year || currentAlbumData.date}
    <p class="album-page-bottom-text">
        {currentAlbumData.date ? currentAlbumData.date : currentAlbumData.year}
    </p>
{/if}
{#if currentAlbumData.copyright }
    <p class="album-page-bottom-text">
        {currentAlbumData.copyright}
    </p>
{/if}</div>

<style>
    .album-page-bottom-data {
        display: flex;
        position: relative;
        width: 100%;
        flex-direction: column
    }

    .album-page-bottom-text {
        display: block;
        position: relative;
        font-family: var(--vm-panel-font-regular);
        font-size: 0.7rem;
        color: var(--vm-panel-font-base);
        user-select: none;
        opacity: 0.5;
        margin: -0.1rem 0;
        font-style: italic;

    }
</style>

