<script lang="ts">
    let {
        text
    } = $props();


</script>

<div class="details-page-section-text-container">
    <p class="details-page-section-text">
        {text}
    </p>
    <hr class="details-page-hr"/>
</div>

<style>
    .details-page-section-text-container {
        display: block;
        position: relative;
    }

    .details-page-section-text {
        font-size: 1rem;
        overflow: hidden;
        text-wrap: nowrap;
        text-overflow: ellipsis;
        color: var(--vm-panel-font-base);
        font-family: var(--vm-panel-font-regular);
        margin: 0;
    }

    .details-page-hr {
        width: 30%;
        height: 1px;
        max-height: 1px;
        background: var(--vm-panel-font-hr);
        margin: 0.1rem 0 0.8rem 0;
        border: none;
    }
</style>