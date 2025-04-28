<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import Search from "./shared/Search.svelte";
    import { type SongDataShort } from "../../../../../main/types/songData";
    import PageLoginRequest from "./shared/PageLoginRequest.svelte";

    let songs: Array<SongDataShort> = $state([]);
    let mpdLoggedIn = $state(false);

    window.electronAPI.loginState((msg) => {
        if (msg.mpd) mpdLoggedIn = msg.mpd;
    });

    window.electronAPI.updateMpdSongList((msg /* Array<SongDataShort> */) => {
        songs = msg;
    });

    const updateSearchItem = (d: string) => {
        window.electron.ipcRenderer.send("mpdGetSongs", d);
    };
</script>

{#if !mpdLoggedIn}
    <PageTitle text="MPD" subtext="Music Player Daemon" />

    <PageLoginRequest text={"Go to settings to set up MPD"} />
{:else}
    <PageTitle text="MPD" subtext="Music Player Daemon" />

    <Search placeholder="Search..." callback={updateSearchItem} />

    <SongList {songs} placeholder="Search something..." />
{/if}

<style>
</style>
