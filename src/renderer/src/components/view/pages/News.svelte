<script>
    import PageTitle from "./shared/PageTitle.svelte";
</script>

<PageTitle text="News" subtext="Straight from the oven"/>

<div class="news-content">
    <p class="news-section-text">
        Pre-Alpha 0.1
    </p>
    <p class="news-text">
        <span class="vermilion-grad">Vermilion</span> is still in pre-alpha stages.<br/>I am constantly working on fixing issues and adding new stuff, don't worry. :)
    </p>
</div>

<style>

    .news-content {
        display: block;
        position: relative;
        border-radius: 1rem;
        padding: 1rem 1rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        height: auto;
        margin-top: 1.5rem;
    }

    .news-text,
    .news-section-text {
        font-family: var(--vm-panel-font-regular);
        font-size: 0.9rem;
        color: var(--vm-panel-font-base);
        user-select: none;
    }

    .news-section-text {
        font-size: 1.4rem;
    }

    .vermilion-grad {
        background: linear-gradient(50deg,rgb(255, 167, 167) 0%, #ff5647 100%);
        background-clip: text;
        color: transparent;
    }
</style>
