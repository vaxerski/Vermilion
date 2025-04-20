<script lang="ts">
    import PageTitle from "./shared/PageTitle.svelte";
    import { type PlaylistDataShort } from "../../../../../main/types/playlistDataShort";
    import PlaylistList from "./shared/PlaylistList.svelte";
    import { currentPage } from "../../state/sharedState.svelte";
    import SongList from "./shared/SongList.svelte";

    let playlists: Array<PlaylistDataShort> = $state([]);

    window.electronAPI.updatePlaylists((msg /* Array<PlaylistData> */) => {
        playlists = msg;
    });

    function prettyTime(time: number) {
        if (time <= 0) return "0:00";
        let mins: number = Math.floor(time / 60);
        let secs: number = Math.floor(time - mins * 60);
        if (mins > 60) {
            let hrs = Math.floor(mins / 60);
            mins -= hrs * 60;
            return (
                hrs +
                ":" +
                (mins > 9 ? mins : "0" + mins) +
                ":" +
                (secs > 9 ? secs : "0" + secs)
            );
        }
        return secs > 9 ? mins + ":" + secs : mins + ":0" + secs;
    }

    function getPlaylistFromState() {
        const pl = currentPage.page.substring("/playlists/playlist/".length);
        for (let i = 0; i < playlists.length; ++i) {
            if (playlists[i].source + "_" + playlists[i].identifier == pl)
                return playlists[i];
        }
        return null;
    }

    window.electron.ipcRenderer.send("gatherPlaylists");
</script>

{#if currentPage.page == "/playlists"}

<PageTitle text="Playlists" subtext="Your favorite jams"/>

<PlaylistList playlists={playlists} />

{/if}



{#key currentPage.page}
{#if currentPage.page.indexOf("/playlists/playlist/") == 0}
<PageTitle text={getPlaylistFromState().name} subtext={getPlaylistFromState().songsNumber + " songs, " + prettyTime(getPlaylistFromState().duration)}/>

<SongList playlist={getPlaylistFromState()} />
{/if}
{/key}


<style>

</style>