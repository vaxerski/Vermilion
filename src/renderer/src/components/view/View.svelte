<script>
    import Home from "./pages/Home.svelte";
    import Mpd from "./pages/Mpd.svelte";
    import News from "./pages/News.svelte";

    import { currentPage, playerData } from "../state/sharedState.svelte";
    import Queue from "./pages/Queue.svelte";
    import Settings from "./pages/Settings.svelte";
    import Tidal from "./pages/Tidal.svelte";
    import Playlists from "./pages/Playlists.svelte";
</script>

<div
    class="view-container"
    style="opacity: {currentPage.page == '/' && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page == '/' && !playerData.fullscreen ? 'visible' : 'hidden'};"
>
    <Home />
</div>

<div
    class="view-container"
    style="opacity: {currentPage.page == '/news' && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page == '/news' && !playerData.fullscreen
        ? 'visible'
        : 'hidden'}; "
>
    <News />
</div>

<div
    class="view-container"
    style="opacity: {currentPage.page == '/queue' && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page == '/queue' && !playerData.fullscreen ? 'visible' : 'hidden'}; "
>
    <Queue />
</div>

<div
    class="view-container"
    style="opacity: {currentPage.page.indexOf('/playlists') == 0 && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page.indexOf('/playlists') == 0 && !playerData.fullscreen ? 'visible' : 'hidden'}; "
>
    <Playlists />
</div>

<div
    class="view-container"
    style="opacity: {currentPage.page == '/mpd' && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page == '/mpd' && !playerData.fullscreen ? 'visible' : 'hidden'}; "
>
    <Mpd />
</div>

<div
    class="view-container"
    style="opacity: {currentPage.page == '/tidal' && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page == '/tidal' && !playerData.fullscreen ? 'visible' : 'hidden'}; "
>
    <Tidal />
</div>

<div
    class="view-container"
    style="opacity: {currentPage.page == '/settings' && !playerData.fullscreen
        ? 1
        : 0}; visibility: {currentPage.page == '/settings' && !playerData.fullscreen ? 'visible' : 'hidden'}; "
>
    <Settings />
</div>

{#if playerData.fullscreen}
<style>
    .view-container {
        transition: 0.5s ease-out;
    }
</style>
{/if}

{#if !playerData.fullscreen}
<style>
    .view-container {
        transition: 0.15s ease-in-out;
    }
</style>
{/if}

<style>
    .view-container {
        display: block;
        position: absolute;
        margin: 0;
        padding: 0;
        padding-bottom: 8.5rem; /* for the miniplayer */
        width: calc(100vw - 13.5rem);
        height: 100vh;
        left: 13.5rem;
        top: 0;
        overflow-x: hidden;
        overflow-y: auto;
        scrollbar-width: auto;
        padding-right: 1.5rem;
    }

    .view-container::-webkit-scrollbar {
        width: 3px;
    }

    .view-container::-webkit-scrollbar-corner {
        background: transparent;
    }

    .view-container::-webkit-scrollbar-thumb {
        background-color: #555555;
        border-radius: 3px;
        background-clip: content-box;
    }
</style>
