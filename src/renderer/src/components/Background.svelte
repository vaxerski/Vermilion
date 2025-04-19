<script lang="ts">
    let hasImage = $state(false);
    let image2InUse = $state(true);
    let lastImage = "";

    window.electronAPI.updateCurrentSong((res) => {
        if (!res.albumCoverUpdated || res.albumCover == lastImage) return;

        const IMG1 = document.getElementById("bg-img");
        const IMG2 = document.getElementById("bg-img-2");

        hasImage = res.albumCover != "";
        lastImage = res.albumCover;

        if (image2InUse && res.albumCover != "") IMG1.src = res.albumCover;
        else if (res.albumCover != "") IMG2.src = res.albumCover;

        image2InUse = !image2InUse;
    });
</script>

<div class="background-reactive">
    <img
        class="background-image"
        id="bg-img"
        src="broken"
        style="visibility: {hasImage
            ? 'visible'
            : 'hidden'}; opacity: {hasImage && !image2InUse ? '1' : '0'};"
    />
    <img
        class="background-image"
        id="bg-img-2"
        src="broken"
        style="visibility: {hasImage
            ? 'visible'
            : 'hidden'}; opacity: {hasImage && image2InUse ? '1' : '0'};"
    />
    <div class="background-darken"></div>
</div>

<style>
    .background-reactive,
    .background-image,
    .background-darken {
        position: absolute;
        z-index: 0;
        background-color: #111111;
        left: -10%;
        top: -10%;
        width: 120%;
        height: 120%;
    }

    .background-image {
        object-fit: cover;
        filter: blur(50px);
        transition: 0.5s ease-in-out;
    }

    .background-darken {
        background-color: #111111cc;
    }
</style>
