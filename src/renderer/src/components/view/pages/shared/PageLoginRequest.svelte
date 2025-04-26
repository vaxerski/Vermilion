<script lang="ts">
    let {
        text
    } = $props();


</script>

<div class="page-login-request">
    <p class="page-login-request-text">
        {text}
    </p>
</div>

<style>
    .page-login-request {
        display: block;
        position: relative;
        width: 100%;
        margin-top: 10rem;
    }

    .page-login-request-text {
        font-size: 1.5rem;
        overflow: hidden;
        text-wrap: nowrap;
        text-overflow: ellipsis;
        color: var(--vm-panel-font-base);
        font-family: var(--vm-panel-font-regular);
        margin: 0;
        text-align: center;
        font-style: italic;
        opacity: 0.6;
    }
</style>