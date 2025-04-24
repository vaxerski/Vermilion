<script lang="ts">
    import type { ArtistData } from "../../../../../../main/types/artistData";
    import ArtistIcon from "../minicontainers/ArtistIcon.svelte";
    import PageTitle from "../shared/PageTitle.svelte";
    import SongList from "../shared/SongList.svelte";
    import PageSection from "../shared/PageSection.svelte";
    import AlbumIcon from "../minicontainers/AlbumIcon.svelte";
    import PageImageTitle from "./PageImageTitle.svelte";
    import BigLink from "../minicontainers/BigLink.svelte";

    let { identifier, source } = $props();

    let currentArtistData: ArtistData = $state({
        name: "Fetching...",
        source: source,
        identifier: "",
        topSongs: [],
        relatedArtists: [],
        newAlbums: [],
    });

    let ID = $props.id();

    window.electronAPI.artistData((msg /* ArtistData */) => {
        if (msg.identifier != identifier || msg.source != source) return;

        if (msg.name == "") msg.name = "Artist";

        currentArtistData = msg;
    });

    function updateArtistData() {
        window.electron.ipcRenderer.send("getArtistData", {
            identifier: identifier,
            source: source,
        });
    }

    updateArtistData();
</script>

<PageImageTitle
    imageURL={currentArtistData.imageURL ? currentArtistData.imageURL : ""}
    text={currentArtistData.name}
    subtext={currentArtistData.name == ""
        ? "Fetching..."
        : "Artist"}
    infotext={"Vermilion is not associated with " + (source == "tidal" ? "Tidal or Tidal Music AS." : "Spotify.")}
/>

<div class="artist-page-top-links">
    <BigLink
        text={"See on " + (source == "tidal" ? "Tidal" : "Spotify")}
        icon={"fa-link"}
        link={(source == "tidal" ? "https://tidal.com/browse/artist/" : "https://open.spotify.com/artist/") + identifier}
    />
</div>

<PageSection text={"Popular tracks"} />

<SongList songs={currentArtistData.topSongs} placeholder="Loading..." />

{#if currentArtistData.newAlbums.length > 0}
    <PageSection text={"New Albums"} />

    <div class="artist-page-related-results-container" id="new-albums-{ID}">
        {#each currentArtistData.newAlbums as album}
            <AlbumIcon
                name={album.name}
                identifier={album.identifier}
                source={album.source}
                duration={album.duration}
                songAmount={album.songsNumber}
                iconURL={album.coverUrl ? album.coverUrl : ""}
                releaseYear={album.year ? album.year : ""}
            />
        {/each}
    </div>
{/if}

{#if currentArtistData.relatedArtists.length > 0}
    <PageSection text={"Related artists"} />

    <div
        class="artist-page-related-results-container"
        id="related-results-{ID}"
    >
        {#each currentArtistData.relatedArtists as artist}
            <ArtistIcon
                name={artist.name}
                identifier={artist.identifier}
                source={artist.source}
                iconURL={artist.imageURL ? artist.imageURL : ""}
            />
        {/each}
    </div>
{/if}

<style>
    .artist-page-related-results-container {
        display: flex;
        position: relative;
        flex-direction: row;
        gap: 0.5rem;
        height: fit-content;
        min-height: fit-content;
        width: auto;
        overflow-x: auto;
        overflow-y: hidden;
        margin: 0;
        margin-bottom: 1rem;
    }

    .artist-page-related-results-container::-webkit-scrollbar-thumb {
        background-color: transparent;
    }

    .artist-page-related-results-container:hover::-webkit-scrollbar-thumb,
    .artist-page-related-results-container:hover::-webkit-scrollbar-thumb:horizontal {
        background-color: #555555;
    }

    .artist-page-top-links {
        display: block;
        position: absolute;
        width: auto;
        height: auto;
        margin-top: 4rem;
        margin-left: 14rem;
    }
</style>
