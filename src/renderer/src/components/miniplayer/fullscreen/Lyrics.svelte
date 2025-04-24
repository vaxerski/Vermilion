<script lang="ts">
    import type { SongInfo } from "../../../../../main/types/songInfo";

    let { lyrics /* LyricData */ } = $props();

    let updateScroll = true;
    let stopUpdateAt = 0;
    let lastI = 0;

    window.electronAPI.updateCurrentSong((res: SongInfo) => {
        // update lyrics if we got em
        if (!lyrics || !lyrics.lyrics) return;

        if (!updateScroll) {
            if (Date.now() - 2000 < stopUpdateAt) return;

            updateScroll = true;
        }

        for (let i = 0; i < lyrics.lyrics.length; ++i) {
            if (
                lyrics.lyrics[i].timeMs <
                res.elapsedSeconds * 1000 - 250 /* debounce */
            )
                continue;

            if (lastI != i) {
                // disable all lyrics
                for (let i = 0; i < lyrics.lyrics.length; ++i) {
                    const EL = document.getElementById("lyrics-lyric-" + i);
                    if (EL.style.opacity != "0.5") EL.style.opacity = "0.5";
                }
            }

            lastI = i;

            const EL = document.getElementById("lyrics-lyric-" + i);
            if (EL.style.opacity != "1") EL.style.opacity = "1";

            const CONT = document.getElementById("lyrics-container");
            const CONT_P = CONT.parentElement;

            const BB = CONT_P.getBoundingClientRect();

            CONT_P.scroll({
                top: EL.offsetTop - BB.height / 2.0,
                behavior: "smooth",
            });

            break;
        }
    });

    setTimeout(() => {
        const CONT = document.getElementById("lyrics-container");
        const CONT_P = CONT.parentElement;

        CONT_P.addEventListener("scroll", (e) => {
            updateScroll = false;
            stopUpdateAt = Date.now();
        });
    }, 1);
</script>

<div class="lyrics-container" id="lyrics-container">
    {#if lyrics}
        {#if lyrics.lyrics.length != 0}
            {#each lyrics.lyrics as lyric, i}
                <p class="lyrics-lyric" id="lyrics-lyric-{i}">
                    {lyric.lyric}
                </p>
            {/each}
        {:else if lyrics.rawLyrics.length != 0}
            {#each lyrics.lyrics as lyric}
                <p class="lyrics-lyric lyrics-lyric-active">
                    {lyric.lyric}
                </p>
            {/each}
        {:else}
            <p class="lyrics-lyric lyrics-lyric-active">
                No lyrics for given track.
            </p>
        {/if}
    {/if}
</div>

<style>
    .lyrics-container {
        position: absolute;
        display: flex;
        width: 100%;
        min-height: 100%;
        flex-direction: column;
        justify-items: center;
        user-select: none;
    }

    .lyrics-lyric {
        font-family: var(--vm-panel-font-medium);
        color: var(--vm-panel-font-base);
        font-size: 1.5rem;
        transition: 0.2s ease-in;
        opacity: 0.5;
        margin: 1rem 0rem;
    }

    .lyrics-lyric-active {
        opacity: 1;
    }
</style>
