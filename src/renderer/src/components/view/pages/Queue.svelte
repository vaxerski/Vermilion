<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import { type SongDataShort } from "../../../../../main/types/songData";

    let songs: Array<SongDataShort> = $state([]);

    window.electronAPI.updateQueue((msg /* QueueData */) => {
        songs = msg.queue;
    });
</script>

<PageTitle text="Queue" subtext="Currently playing"/>

<SongList songs={songs} queue={true}/>

<style>

</style>