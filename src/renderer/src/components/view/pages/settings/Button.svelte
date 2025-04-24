<script lang="ts">
    let { text, buttonText, callback } = $props();

    function sendCallback() {
        callback();
    }
</script>

<div class="option-container">
    <p class="option-name">
        {text}
    </p>
    <div class="button-container" on:click={sendCallback}>
        <p class="button-text">
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

    .button-container {
        position: absolute;
        display: block;
        width: 11rem;
        height: 2.3rem;
        right: 0.5rem;
        background-color: var(--vm-panel-background);
        border: 1px solid var(--vm-panel-border);
        border-radius: 0.7rem;
        margin-bottom: 1rem;
        cursor: pointer;
        transition: 0.15s ease-in;
    }

    .button-container:hover {
        background-color: var(--vm-panel-background-active);
    }

    .button-text {
        position: absolute;
        top:50%;
        text-align: center;
        width: 100%;
        font-family: var(--vm-panel-font-regular);
        color: var(--vm-panel-font-base);
        font-size: 0.9rem;
        transform: translateY(-50%);
    }
</style>
