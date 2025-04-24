<script>
    import Button from "./Button.svelte";
    import Divider from "./Divider.svelte";

    import { currentPage, playerData } from "../state/sharedState.svelte";
    import SectionText from "./SectionText.svelte";
</script>

<div
    class="panel-container"
    style="opacity: {playerData.fullscreen
        ? '0'
        : '1'}; visibility: {playerData.fullscreen
        ? 'hidden'
        : 'visible'};transition: 0.5s ease-out;"
>
    <Divider />
    <SectionText text="Main" />
    <Button
        icon="fa-solid fa-house"
        text="Home"
        href="/"
        active={currentPage.page == "/" ? true : false}
    />
    <Button
        icon="fa-solid fa-lightbulb"
        text="Release News"
        href="/news"
        active={currentPage.page == "/news" ? true : false}
    />
    <Divider />
    <SectionText text="Music" />
    <Button
        icon="fa-solid fa-bars"
        text="Queue"
        href="/queue"
        active={currentPage.page == "/queue" ? true : false}
    />
    <Button
        icon="fa-solid fa-record-vinyl"
        text="Playlists"
        href="/playlists"
        active={currentPage.page.indexOf("/playlists") == 0 ? true : false}
    />
    <Button
        icon="fa-solid fa-heart"
        text="Favorites"
        href="/favorites"
        active={currentPage.page == "/favorites" ? true : false}
    />
    <Divider />
    <SectionText text="Integrations" />
    <Button
        icon="fa-solid fa-music"
        text="MPD"
        href="/mpd"
        active={currentPage.page == "/mpd" ? true : false}
    />
    <Button
        icon="tidal"
        text="Tidal"
        href="/tidal"
        active={currentPage.page.indexOf('/tidal') == 0 ? true : false}
    />
    <Button
        icon="fa-brands fa-spotify"
        text="Spotify"
        href="/spotify"
        active={currentPage.page.indexOf('/spotify') == 0 ? true : false}
    />
    <Button
        icon="fa-brands fa-youtube"
        text="YT Music"
        href="/yt"
        active={currentPage.page.indexOf('/yt') == 0 ? true : false}
    />
    <Divider />
    <SectionText text="Other" />
    <Button
        icon="fa-solid fa-gear"
        text="Settings"
        href="/settings"
        active={currentPage.page == "/settings" ? true : false}
    />
</div>

<style>
    .panel-container {
        display: flex;
        flex-direction: column;
        gap: 0rem;
        position: absolute;
        margin: 0;
        padding: 0;
        padding-top: 1rem;
        width: auto;
        height: 100vh;
        left: 0;
        top: 0;
        z-index: 5;
        border-bottom-right-radius: 1rem;
        border-top-right-radius: 1rem;
        border-right: solid var(--vm-panel-border) 1px;
        background: linear-gradient(125deg, #42181899 0%, #11111199 100%);
        justify-content: baseline;
        backdrop-filter: saturate(150%) blur(50px);
    }
</style>
