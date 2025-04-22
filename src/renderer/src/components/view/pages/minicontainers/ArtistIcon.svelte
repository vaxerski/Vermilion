<script lang="ts">
    import { changePageTo } from "../../../state/sharedState.svelte";

    let { iconURL = "", name, identifier, source } = $props();

    function goToArtist() {
        changePageTo("/" + source + "/artist/" + identifier);
    }
</script>

<div class="artist-icon-container" on:click={goToArtist}>
    {#if iconURL != ""}
        <img class="artist-icon-image" src={iconURL} />
    {:else}
        <div class="artist-icon-image artist-icon-image-missing" />
    {/if}

    <p class="artist-icon-name">
        {name}
    </p>
</div>

<style>
    .artist-icon-container {
        display: flex;
        flex-direction: column;
        position: relative;
        width: 8rem;
        border-radius: 1rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        backdrop-filter: saturate(150%) blur(50px);
        padding: 0.5rem;
        cursor: pointer;
        transition: 0.15s ease-in;
        justify-content: center;
        align-items: center;
        user-select: none;
    }

    .artist-icon-container:hover {
        background: var(--vm-panel-background-active);
    }

    .artist-icon-image {
        position: relative;
        display: block;
        width: 7rem;
        height: 7rem;
        margin-top: 0.5rem;
        border-radius: 50%;
        padding: 0;
        border: solid var(--vm-panel-border) 1px;
    }

    .artist-icon-name {
        font-family: var(--vm-panel-font-regular);
        font-size: 0.9rem;
        color: var(--vm-panel-font-base);
        width: 90%;
        overflow: hidden;
        text-align: center;
        text-overflow: ellipsis;
        text-wrap: nowrap;
        margin-top: 0.5rem;
        margin-left: 5%;
    }
</style>
