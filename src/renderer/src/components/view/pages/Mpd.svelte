<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import Search from "./shared/Search.svelte";
    import { type SongDataShort } from "../../../../../main/types/songData";

    let songs: Array<SongDataShort> = []

    window.electronAPI.updateMpdSongList((msg /* Array<SongDataShort> */) => {
        songs = msg;
    });

    const updateSearchItem = (d: string) => {
        window.electron.ipcRenderer.send('mpdGetSongs', d);
    }
</script>

<PageTitle text="MPD" subtext="Music Player Daemon"/>

<Search placeholder="Search..." callback={updateSearchItem}/>

<SongList songs={songs} placeholder="Search something..."/>

<style>

</style>