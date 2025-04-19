<script>
    let { text, subtext = "", infotext = ""} = $props();
</script>

<div class="page-top-text-container">
    <p class="page-top-label">{text}</p>
    <p class="page-top-sublabel">{subtext}</p>
    <p class="page-top-infotext">{infotext}</p>
</div>

<style>
    .page-top-text-container {
        display: block;
        position: relative;
        margin-bottom: 1rem;
        user-select: none;
    }

    .page-top-label {
        font-family: var(--vm-panel-font-medium);
        font-size: 2.5rem;
        background: linear-gradient(50deg,rgb(255, 167, 167) 0%, #ff5647 100%);
        background-clip: text;
        color: transparent;
        margin: 0;
        width: auto;
    }

    .page-top-sublabel {
        font-family: var(--vm-panel-font-medium);
        font-size: 1rem;
        background: linear-gradient(50deg,rgb(255, 167, 167) 0%, #ff5647 100%);
        background-clip: text;
        color: transparent;
        font-style: italic;
        margin-top: -1.05rem;
        opacity: 0.5;
    }

    .page-top-infotext {
        position: absolute;
        right: -1.1rem;
        top: 0.2rem;
        font-family: var(--vm-panel-font-medium);
        font-size: 0.7rem;
        color: var(--vm-panel-font-darker);
        font-style: italic;
        opacity: 0.5;
    }

</style>
