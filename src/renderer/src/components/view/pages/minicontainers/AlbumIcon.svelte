<script lang="ts">
    import {
        changePageTo,
        prettyTime,
    } from "../../../state/sharedState.svelte";

    let {
        iconURL = "",
        name,
        identifier,
        source,
        songAmount,
        duration,
        releaseYear = "",
        artist = "",
    } = $props();

    function goToAlbum() {
        changePageTo("/" + source + "/album/" + identifier);
    }
</script>

<div class="album-icon-container" on:click={goToAlbum}>
    {#if iconURL != ""}
        <img class="album-icon-image" src={iconURL} />
    {:else}
        <div class="album-icon-image album-icon-image-missing" />
    {/if}

    <p class="album-icon-text album-icon-name">
        {name}
    </p>

    {#if releaseYear != "" || artist != ""}
        <p class="album-icon-text album-icon-year">
            {artist != "" ? artist : releaseYear}
        </p>
    {/if}

    <p class="album-icon-text album-icon-duration">
        {songAmount} songs, {prettyTime(duration)}
    </p>
</div>

<style>
    .album-icon-container {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 8rem;
        border-radius: 1rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        backdrop-filter: saturate(150%) blur(50px);
        padding: 0;
        cursor: pointer;
        transition: 0.15s ease-in;
        padding-bottom: 0.4rem;
        user-select: none;
    }

    .album-icon-container:hover {
        background: var(--vm-panel-background-active);
    }

    .album-icon-image {
        width: 7.2rem;
        height: 7.2rem;
        margin-left: 0.34rem;
        margin-top: 0.5rem;
        border-radius: 50%;
        padding: 0;
        border: solid var(--vm-panel-border) 1px;
    }

    .album-icon-text {
        font-family: var(--vm-panel-font-regular);
        color: var(--vm-panel-font-base);
        width: 90%;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        text-wrap: nowrap;
        margin-left: 5%;
    }

    .album-icon-name {
        margin-top: 0.5rem;
        font-size: 0.9rem;
    }

    .album-icon-duration {
        font-size: 0.65rem;
        opacity: 0.8;
        font-style: italic;
        margin-top: -0.3rem;
    }

    .album-icon-year {
        font-size: 0.65rem;
        opacity: 0.8;
        font-style: italic;
        margin-top: -0.1rem;
    }
</style>
