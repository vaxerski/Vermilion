<script lang="ts">
    import { blur } from "svelte/transition";

    let { placeholder = "", valueName, text, secret = false } = $props();

    let value = $state("");

    window.electronAPI.sendSetting((res) => {
        if (res.setting != valueName) return;

        value = res.value;
    });

    function sendCallback() {
        const input = document.getElementById("input-box-" + valueName);

        window.electron.ipcRenderer.send("setSetting", {
            setting: valueName,
            value: input.value,
        });
    }

    function onKeyDown(e) {
        if (e.key !== "Enter") return;

        sendCallback();
    }

    function onLostFocus() {
        sendCallback();
    }

    window.electron.ipcRenderer.send("getSetting", valueName);
</script>

<div class="option-container">
    <p class="option-name">
        {text}
    </p>
    <div class="input-container">
        <input
            type="{secret ? "password" : "text"}"
            id="input-box-{valueName}"
            class="input-input"
            {placeholder}
            on:keydown={onKeyDown}
            on:focusout={onLostFocus}
            {value}
        />
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

    .input-container {
        position: absolute;
        display: block;
        width: 16rem;
        height: 2.3rem;
        right: 0.5rem;
        background-color: var(--vm-panel-background);
        border: 1px solid var(--vm-panel-border);
        border-radius: 0.7rem;
        margin-bottom: 1rem;
    }

    .input-input,
    .input-input:default,
    .input-input:read-write,
    .input-input:valid,
    .input-input:invalid,
    .input-input:enabled,
    .input-input:disabled,
    .input-input:focus,
    .input-input:open {
        background: transparent;
        color: var(--vm-panel-font-base);
        display: block;
        position: absolute;
        width: 85%;
        height: 100%;
        border: 0;
        outline: none;
        margin-left: 2%;
    }
</style>
