<script lang="ts">
    import PageTitle from "../shared/PageTitle.svelte";
    import SongList from "../shared/SongList.svelte";

    import type { AlbumData } from "../../../../../../main/types/albumData";
    import PageImageTitle from "./PageImageTitle.svelte";
    import BigLink from "../minicontainers/BigLink.svelte";

    let { identifier, source } = $props();

    let currentAlbumData: AlbumData = $state({
        name: "Loading...",
        source: source,
        identifier: "",
        artist: "Fetching...",
        songs: [],
    });

    window.electronAPI.albumData((msg /* AlbumData */) => {
        if (msg.identifier != identifier || msg.source != source) return;

        if (msg.name == "") msg.name = "Album";

        currentAlbumData = msg;
    });

    function updateAlbumData() {
        window.electron.ipcRenderer.send("getAlbumData", {
            identifier: identifier,
            source: source,
        });
    }

    updateAlbumData();
</script>

    <PageImageTitle
        imageURL={currentAlbumData.coverVideoUrl
            ? currentAlbumData.coverVideoUrl
            : currentAlbumData.coverUrl
              ? currentAlbumData.coverUrl
              : ""}
        imageIsVideo={!!currentAlbumData.coverVideoUrl}
        imageBig={true}
        text={currentAlbumData.name}
        subtext={currentAlbumData.artist}
        year={currentAlbumData.year ? currentAlbumData.year : ""}
        infotext={"Vermilion is not associated with " + (source == "tidal" ? "Tidal or Tidal Music AS." : "Spotify.")}
    />

    <div class="album-page-top-links">
        <BigLink
            text={"See on " + (source == "tidal" ? "Tidal" : "Spotify")}
            icon={"fa-link"}
            link={(source == "tidal" ? "https://tidal.com/browse/album/" : "https://open.spotify.com/album/") + identifier}
        />
    </div>

<SongList
    songs={currentAlbumData.songs}
    placeholder="Loading..."
    propagateSongs={true}
/>

<div class="album-page-bottom-data">
    {#if currentAlbumData.year || currentAlbumData.date}
        <p class="album-page-bottom-text">
            {currentAlbumData.date
                ? currentAlbumData.date
                : currentAlbumData.year}
        </p>
    {/if}
    {#if currentAlbumData.copyright}
        <p class="album-page-bottom-text">
            {currentAlbumData.copyright}
        </p>
    {/if}
</div>

<style>
    .album-page-bottom-data {
        display: flex;
        position: relative;
        width: 100%;
        flex-direction: column;
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

    .album-page-top-links {
        display: block;
        position: absolute;
        width: auto;
        height: auto;
        margin-top: 4rem;
        margin-left: 21rem;
    }
</style>
