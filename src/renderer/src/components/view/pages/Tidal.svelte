<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import Search from "./shared/Search.svelte";
    import ArtistIcon from "./minicontainers/ArtistIcon.svelte";
    import { type SearchResults } from "../../../../../main/types/searchResults";
    import { currentPage } from "../../state/sharedState.svelte";
    import ArtistPage from "./tidal/ArtistPage.svelte";
    import PageSection from "./shared/PageSection.svelte";
    import AlbumPage from "./tidal/AlbumPage.svelte";
    import AlbumIcon from "./minicontainers/AlbumIcon.svelte";

    let searchResults: SearchResults = $state({
        songs: [],
        artists: [],
        albums: []
    });

    const ID = $props.id();

    window.electronAPI.updateTidalSearch((msg /* Array<SongDataShort> */) => {
        searchResults = msg;
    });

    const updateSearchItem = (d: string) => {
        window.electron.ipcRenderer.send("tidalGetSongs", d);
    };
</script>

{#if currentPage.pageTidal.indexOf("/tidal/artist/") == 0}
    {#key currentPage.pageTidal}
        <ArtistPage
            identifier={currentPage.page.substring("/tidal/artist/".length)}
            source={"tidal"}
        />
    {/key}
{:else if currentPage.pageTidal.indexOf("/tidal/album/") == 0}
    {#key currentPage.pageTidal}
        <AlbumPage
            identifier={currentPage.page.substring("/tidal/album/".length)}
            source={"tidal"}
        />
    {/key}
{:else}
    <PageTitle
        text="Tidal"
        subtext="Stream high-res music from Tidal"
        infotext="Vermilion is not associated with Tidal or Tidal Music AS."
    />

    <Search placeholder="Search..." callback={updateSearchItem} />

    {#if searchResults.artists.length > 0}
        <PageSection text={"Artists"} />

        <div class="artist-results-container" id="artist-results-{ID}">
            {#each searchResults.artists as artist}
                <ArtistIcon
                    name={artist.name}
                    identifier={artist.identifier}
                    source={artist.source}
                    iconURL={artist.imageURL ? artist.imageURL : ""}
                />
            {/each}
        </div>
    {/if}

    {#if searchResults.albums.length > 0}
        <PageSection text={"Albums"} />
        <div class="artist-results-container" id="album-results-{ID}">
            {#each searchResults.albums as album}
                <AlbumIcon
                    name={album.name}
                    identifier={album.identifier}
                    source={album.source}
                    songAmount={album.songsNumber}
                    duration={album.duration}
                    iconURL={album.coverUrl ? album.coverUrl : ""}
                    releaseYear={album.year ? album.year : ""}
                    artist={album.artistString}
                />
            {/each}
        </div>
    {/if}

    <PageSection text={"Tracks"} />

    <SongList songs={searchResults.songs} placeholder="Search something..." />
{/if}

<style>
    .artist-results-container {
        display: flex;
        position: relative;
        flex-direction: row;
        gap: 0.5rem;
        height: fit-content;
        width: auto;
        margin: 0;
        margin-bottom: 1rem;
        overflow-x: auto;
        overflow-y: hidden;
        min-height: fit-content;
        padding-right: 1.5rem;
    }

    .artist-results-container::-webkit-scrollbar-thumb {
        background-color: transparent;
    }

    .artist-results-container:hover::-webkit-scrollbar-thumb,
    .artist-results-container:hover::-webkit-scrollbar-thumb:horizontal {
        background-color: #555555;
    }
</style>
