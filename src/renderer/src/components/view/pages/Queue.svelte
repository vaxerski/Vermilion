<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import SongList from "./shared/SongList.svelte";
    import { type SongDataShort } from "../../../../../main/types/songData";

    let songs: Array<SongDataShort> = $state([]);
    let breaker: number = $state(-1);

    window.electronAPI.updateQueue((msg /* QueueData */) => {
        songs = msg.queue;
        breaker = msg.playlistBreaker;
    });
</script>

<PageTitle text="Queue" subtext="Currently playing"/>

<SongList songs={songs} queue={true} queueBreaker={breaker}/>

<style>

</style>