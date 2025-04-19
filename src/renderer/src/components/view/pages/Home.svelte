<script lang="ts">
    function openRepo() {
        window.electron.ipcRenderer.send("openRepo");
    }
</script>

<div class="home-top-text-container">
    <p class="home-top-label">Welcome to <i>Vermilion</i></p>
</div>

<div class="home-content">
    <p class="home-text">
        <span class="vermilion-grad">Vermilion</span> is <i>just another music player</i>.<br />
        It's aimed to be a simple and modern-looking music player for MPD and (in the future)
        some streaming services, all in one.<br/><br/>
        Currently, <span class="vermilion-grad">Vermilion</span> is in <i>pre-alpha</i> stages. Please do expect bugs
        and issues.<br/><br/>
        <span class="vermilion-grad">Vermilion</span> is <i>not</i> aimed to be an all-powerful and do-it-all magic backflips and everything player.
        It's meant to be <i>simple</i>, so don't expect crazy features. It has all you need from
        a modern music player, and nothing more.<br/><br/>
        If you want to help with the development, <span class="vermilion-grad">Vermilion</span> is made in Electron and Svelte. See 
        <a target="_blank" class="home-link" href="" on:click={openRepo}>the repo</a>.
        <br/><br/>
        The name <span class="vermilion-grad">Vermilion</span> comes from the same word, defined as a vivid red to reddish-orange color.
    </p>
</div>

<style>
    .home-top-text-container {
        display: block;
        position: relative;
        margin-left: 1rem;
        margin-top: 1rem;
        user-select: none;
    }

    .home-top-label {
        font-family: var(--vm-panel-font-medium);
        font-size: 2.5rem;
        background: linear-gradient(50deg,rgb(255, 167, 167) 0%, #ff5647 100%);
        background-clip: text;
        color: transparent;
        user-select: none;
    }

    .home-content {
        display: block;
        position: relative;
        border-radius: 1rem;
        padding: 1rem 1rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        height: auto;
        margin-top: 1.5rem;
    }

    .home-text,
    .home-link {
        font-family: var(--vm-panel-font-regular);
        font-size: 0.9rem;
        color: var(--vm-panel-font-base);
        user-select: none;
    }

    .home-link,
    .home-link:visited {
        color: #ff5647;
        text-decoration: none;
    }

    .vermilion-grad {
        background: linear-gradient(50deg,rgb(255, 167, 167) 0%, #ff5647 100%);
        background-clip: text;
        color: transparent;
    }
</style>
