<script lang="ts">
    let { text } = $props();
</script>

<div class="song-entry-breaker-container">
    <p class="song-entry-breaker">
        {text}
    </p>
</div>

<style>
    .song-entry-breaker-container {
        display: block;
        position: relative;
        width: 100%;
        height: 2rem;
        padding: 0;
        margin: 0;
    }

    .song-entry-breaker {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        color: var(--vm-panel-font-base);
        font-family: var(--vm-panel-font-regular);
        font-size: 0.8rem;
        opacity: 0.8;
        text-align: center;
        width: 100%;
        font-style: italic;
        user-select: none;
    }
</style>
