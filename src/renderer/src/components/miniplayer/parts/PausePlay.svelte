<script lang="ts">
    let { icon, callback } = $props();
</script>

<div
    class="miniplayer-play-pause-container"
    onclick={callback}
>
    <i class="miniplayer-play-pause-icon {icon}"></i>
</div>

<style>
    .miniplayer-play-pause-container {
        display: block;
        position: absolute;
        width: 100%;
        height: 100%;
        top: 0;
        left: 0;
    }

    .miniplayer-play-pause-container:hover > .miniplayer-play-pause-icon {
        color: var(--vm-panel-font-highlight-mid);
    }

    .miniplayer-play-pause-icon {
        display: block;
        position: absolute;
        font-size: 1rem;
        transform: translateX(-50%) translateY(-50%);
        left: 50%;
        top: 50%;
        color: var(--vm-panel-font-base);
        transition: 0.1s ease-in;
    }
</style>
