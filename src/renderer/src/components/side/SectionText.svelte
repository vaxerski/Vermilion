<script lang="ts">
    let { text } = $props();
</script>

<div class="section-text-container">
    <p class="section-text">
        {text}
    </p>
</div>

<style>
    .section-text-container {
        display: block;
        position: relative;
        width: 100%;
        margin: 0;
        user-select: none;
    }

    .section-text {
        font-family: var(--vm-panel-font-regular);
        font-size: 0.7rem;
        color: var(--vm-panel-font-base);
        text-align: center;
        font-style: italic;
        margin: 0;
        padding: 0;
        margin-bottom: 0rem;
        opacity: 0.7;
    }
</style>
