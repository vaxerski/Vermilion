<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import Search from "./shared/Search.svelte";
    import { type SongDataShort } from "../../../../../main/types/songData";
    import TidalDrm from "../../drm/TidalDRM.svelte";

    let songs: Array<SongDataShort> = []

    window.electronAPI.updateTidalSongList((msg /* Array<SongDataShort> */) => {
        songs = msg;
    });

    const updateSearchItem = (d: string) => {
        window.electron.ipcRenderer.send('tidalGetSongs', d);
    }
</script>

<PageTitle text="Tidal" subtext="Stream high-res music from Tidal" infotext="Vermilion is not associated with Tidal or Tidal Music AS."/>

<Search placeholder="Search..." callback={updateSearchItem}/>

<SongList songs={songs} placeholder="Search something..."/>

<TidalDrm/>

<style>

</style>