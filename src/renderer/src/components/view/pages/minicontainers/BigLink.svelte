<script lang="ts">
    let { icon, link, text } = $props();

    function openLink() {
        window.electron.ipcRenderer.send("openLink", link);
    }
</script>

<div class="big-link-container" on:click={openLink}>
    <div class="big-link-icon-container">
        <i class="big-link-icon fa-solid {icon}" />
    </div>

    <p class="big-link-text">
        {text}
    </p>
</div>

<style>
    .big-link-container {
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        padding: 0.2rem;
        width: auto;
        height: 2rem;
        display: flex;
        transition: 0.15s ease-in;
        padding-right: 0.6rem;
        border-radius: 0.5rem;
        cursor: pointer;
        backdrop-filter: saturate(150%) blur(50px);
    }

    .big-link-container:hover {
        background: var(--vm-panel-background-active);
    }

    .big-link-icon-container {
        height: 100%;
        width: 1.6rem;
        position: relative;
        display: block;
    }

    .big-link-icon {
        font-size: 1rem;
        color: var(--vm-panel-font-base);
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
    }

    .big-link-text,
    .big-link-text:active,
    .big-link-text:link,
    .big-link-text:visited {
        font-size: 0.7rem;
        color: var(--vm-panel-font-base);
        position: relative;
        top: 50%;
        text-decoration: none;
        font-style: italic;
        transform: translateY(-35%);
        margin-left: 0.3rem;
    }
</style>
