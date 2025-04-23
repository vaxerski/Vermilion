<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import Search from "./shared/Search.svelte";
    import { type SearchResults } from "../../../../../main/types/searchResults";
    import PageSection from "./shared/PageSection.svelte";
    import ArtistIcon from "./minicontainers/ArtistIcon.svelte";
    import AlbumIcon from "./minicontainers/AlbumIcon.svelte";

    let searchResults: SearchResults = $state({
        songs: [],
        artists: [],
        albums: [],
    });

    const ID = $props.id();

    window.electronAPI.updateYtSearch((msg /* Array<SongDataShort> */) => {
        searchResults = msg;
    });

    const updateSearchItem = (d: string) => {
        window.electron.ipcRenderer.send("ytGetSongs", d);
    };
</script>

<PageTitle
    text="Youtube Music"
    subtext="Stream music from Youtube Music"
    infotext="Vermilion is not associated with Youtube Music or Google LLC."
/>

<Search placeholder="Search..." callback={updateSearchItem} />

<!--

This needs more work. I am banned from the API without cookies and AFAIU ytmusic-api doesn't support passing the cookies like yt-dlp 
so developing this is a chore

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
-->

<PageSection text={"Tracks"} />

<SongList songs={searchResults.songs} placeholder="Search something..." />

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
