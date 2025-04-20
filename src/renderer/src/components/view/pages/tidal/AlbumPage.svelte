<script lang="ts">
    import PageTitle from "../shared/PageTitle.svelte";
    import SongList from "../shared/SongList.svelte";

    import type { AlbumData } from "../../../../../../main/types/albumData";
    import PageImageTitle from "./PageImageTitle.svelte";

    let { identifier, source } = $props();

    let currentAlbumData: AlbumData = $state({
        name: "Loading...",
        source: source,
        identifier: "",
        artist: "Fetching from Tidal...",
        songs: []
    });

    window.electronAPI.albumData((msg /* AlbumData */) => {
        if (msg.identifier != identifier) return;

        if (msg.name == "") msg.name = "Album";

        currentAlbumData = msg;
    });

    function updateAlbumData() {
        window.electron.ipcRenderer.send("getAlbumData", {
            identifier: identifier,
            source: "tidal",
        });
    }

    updateAlbumData();
</script>

<PageImageTitle
    imageURL={currentAlbumData.coverUrl ? currentAlbumData.coverUrl : ""}
    imageBig={true}
    text={currentAlbumData.name}
    subtext={currentAlbumData.artist}
    infotext="Vermilion is not associated with Tidal or Tidal Music AS."
/>

<SongList songs={currentAlbumData.songs} placeholder="Loading..." propagateSongs={true} />
