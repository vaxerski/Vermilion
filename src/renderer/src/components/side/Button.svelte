<script lang="ts">
    let { icon, text, href, active } = $props();

    import { changePageTo } from "../state/sharedState.svelte";

    function changePage() {
        changePageTo(href);
    }
</script>

<a class="button-container {active ? 'button-container-active' : ''}" on:click="{changePage}" href="#">
    
    <div class="button-icon-container">
        {#if icon != "tidal" }
        <i class="button-icon {icon}"></i>
        {/if}
        {#if icon == "tidal" }
        <img class="button-icon" style="width: 1.3rem; transform: translateX(-45%) translateY(-50%);" src="../../resources/tidal.svg?asset"/>
        {/if}
    </div>
    <p class="button-text {active ? 'button-text-active' : ''}">{text}</p>
</a>

<style>
    .button-container,
    .button-container:link,
    .button-container:visited {
        display: flex;
        width: 10rem;
        margin: 0.15rem 1rem;
        border-radius: 0.5rem;
        align-items: baseline;
        flex-direction: row;
        align-items: center;
        align-self: center;
        text-decoration: none;
        padding: 0.2rem 0.5rem;
        background-color: transparent;
        border: solid 1px transparent;
        transition: 0.15s ease-in-out;
        user-select: none;
    }

    .button-container:hover {
        border: solid 1px #952c2388;
    }

    .button-container-active,
    .button-container-active:link,
    .button-container-active:visited {
        border: solid 1px #e3423488;
    }

    .button-icon-container {
        display: inline-block;
        position: relative;
        width: 1.5rem;
        height: 100%;
        margin: 0;
        padding: 0;
        margin-right: 0.7rem;
    }

    .button-icon {
        display: block;
        position: absolute;
        font-size: 1rem;
        transform: translateX(-50%) translateY(-50%);
        left: 50%;
        top: 50%;
        color: var(--vm-icon-deep);
    }

    .button-text {
        display: inline-block;
        font-family: var(--vm-panel-font-regular); /* TODO: change */
        font-size: 0.9rem;
        color: var(--vm-panel-font-base);
        transition: 0.15s ease-in-out;
    }

    .button-container:hover > .button-text {
        color: #f0a3a3;
    }

    .button-text-active {
        color: var(--vm-panel-font-highlight-strong);
    }

    .button-container:hover > .button-text-active {
        color: var(--vm-panel-font-highlight-burning);
    }
</style>
