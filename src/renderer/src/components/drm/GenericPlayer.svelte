<script lang="ts">
    window.electronAPI.playGeneric((res) => {
        // res should be a Base64 string
        document.getElementById("yt-video-source").src = res;
    });

    window.electronAPI.genericPlayerPlayEvent((res) => {
        const VIDEO = document.getElementById("yt-video-source");
        console.log(res);

        if (res.volume) VIDEO.volume = res.volume;
        if (res.seek) VIDEO.currentTime = res.seek;
        if (res.play != undefined) {
            if (res.play) VIDEO.play();
            else VIDEO.pause();
        }
    });

    setInterval(() => {
        // update the main thread with our elapsed
        const VIDEO = document.getElementById("yt-video-source");
        window.electron.ipcRenderer.send("genericPlayerElapsed", VIDEO.currentTime);
    }, 500);
</script>

<video id="yt-video-source" autoplay />

<style>
    #yt-video-source {
        visibility: hidden;
        position: absolute;
        top: -100vw;
        left: -100vw;
        width: 1px;
        height: 1px;
        z-index: 0;
    }
</style>
