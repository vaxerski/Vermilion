<script lang="ts">
    let { text = "", buttonText, callback } = $props();

    function sendCallback() {
        callback();
    }
</script>

<div class="option-container">
    {#if text != ""}
        <p class="option-name">
            {text}
        </p>
    {/if}
    <div
        class="setting-button-container"
        onclick={sendCallback}
        style={text == ""
            ? "left: 50%;transform: translateX(-50%);"
            : "right: 0.5rem;"}
    >
        <p class="setting-button-text">
            {buttonText}
        </p>
    </div>
</div>

<style>
    .option-name {
        position: absolute;
        display: block;
        width: 25rem;
        overflow: hidden;
        text-wrap: nowrap;
        text-overflow: ellipsis;
        color: var(--vm-panel-font-base);
        font-family: var(--vm-panel-font-regular);
        top: 50%;
        transform: translateY(-50%);
        font-size: 0.8rem;
    }

    .option-container {
        position: relative;
        display: block;
        width: 100%;
        height: 2.3rem;
    }

    .setting-button-container {
        position: absolute;
        display: block;
        width: 11rem;
        height: 2.3rem;
        background-color: var(--vm-panel-background);
        border: 1px solid var(--vm-panel-border);
        border-radius: 0.7rem;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: 0.15s ease-in;
    }

    .setting-button-container:hover {
        background-color: var(--vm-panel-background-active);
    }

    .setting-button-text {
        position: absolute;
        top: 50%;
        text-align: center;
        width: 100%;
        font-family: var(--vm-panel-font-regular);
        color: var(--vm-panel-font-base);
        font-size: 0.9rem;
        transform: translateY(-50%);
    }
</style>
