<script>
    let {
        text,
        subtext = "",
        infotext = "",
        imageURL = "",
        imageBig = false,
        year = "",
    } = $props();
</script>

<div class="page-image-title-container">
    <p class="page-image-title-infotext">{infotext}</p>

    {#if imageURL != ""}
        <img
            class="page-image-title-image"
            src={imageURL}
            style={imageBig
                ? "width: 20rem; height: 20rem; margin-bottom: 1rem;"
                : "border-radius: 2rem;"}
        />
    {:else}
        <div
            class="page-image-title-image page-image-title-image-missing"
            style={imageBig
                ? "width: 20rem; height: 20rem; margin-bottom: 1rem;"
                : "border-radius: 2rem;"}
        ></div>
    {/if}
    <p class="page-image-title-label">{text}</p>
    <p class="page-image-title-sublabel">
        {subtext}

        {#if year != ""}
            <p class="page-image-title-year">{year}</p>
        {/if}
    </p>
    <hr class="page-image-title-hr" />
</div>

<style>
    .page-image-title-image {
        width: 13rem;
        height: 13rem;
        position: relative;
        display: block;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        border-radius: 2rem;
    }

    .page-image-title-hr {
        width: 30%;
        height: 1px;
        max-height: 1px;
        background: var(--vm-panel-font-hr);
        margin: 0.1rem 0 0.8rem 0;
        border: none;
    }

    .page-image-title-container {
        display: block;
        position: relative;
        margin-bottom: 1rem;
        user-select: none;
        padding-top: 2rem;
    }

    .page-image-title-label {
        font-family: var(--vm-panel-font-medium);
        font-size: 1.5rem;
        background: var(--vm-panel-font-base);
        background-clip: text;
        color: transparent;
        margin: 0;
        width: auto;
    }

    .page-image-title-sublabel {
        font-family: var(--vm-panel-font-medium);
        font-size: 1rem;
        background: var(--vm-panel-font-base);
        background-clip: text;
        color: transparent;
        font-style: italic;
        margin-top: -0.5rem;
        opacity: 0.5;
    }

    .page-image-title-year {
        display: inline-block;
        font-family: var(--vm-panel-font-medium);
        font-size: 0.7rem;
        background: var(--vm-panel-font-base);
        background-clip: text;
        color: transparent;
        font-style: italic;
        margin-top: -0.3rem;
        opacity: 0.8;
        padding-right: 0.2rem; /* fix clipping */
        padding-left: 0.2rem;
    }

    .page-image-title-infotext {
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
