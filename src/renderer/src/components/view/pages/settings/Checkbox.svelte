<script lang="ts">
    import { blur } from "svelte/transition";

    let { valueName, text } = $props();

    let value = $state(false);

    window.electronAPI.sendSetting((res) => {
        if (res.setting != valueName) return;

        value = res.value;
    });

    function sendCallback() {
        window.electron.ipcRenderer.send("setSetting", {
            setting: valueName,
            value: value,
        });
    }

    function onClick() {
        value = !value;
        sendCallback();
    }

    window.electron.ipcRenderer.send("getSetting", valueName);
</script>

<div class="option-container">
    <p class="option-name">
        {text}
    </p>
    <div class="checkbox-container" style="{value ? "background-color: #FF9B99" : ""}" onclick={onClick}>
        <i class="checkbox-check fa-solid fa-check" style="visibility: {value ? "visible" : "hidden"}; opacity: {value ? "1" : "0"};"/>
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

    .checkbox-container {
        position: absolute;
        display: block;
        width: 1.5rem;
        height: 1.5rem;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        background-color: var(--vm-panel-background);
        border: 1px solid var(--vm-panel-border);
        border-radius: 0.5rem;
        transition: 0.2s ease-in-out;
    }

    .checkbox-check {
        transition: 0.2s ease-in-out;
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
    }
</style>
