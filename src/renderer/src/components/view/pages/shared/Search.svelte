<script lang="ts">

    const ID = $props.id();

    let { placeholder = "Search... ", callback = (d) => {} } = $props();

    function sendCallback() {
        const input = document.getElementById("search-box-" + ID);
        callback(input.value);
    }

    function onKeyDown(e) {
        if (e.key !== "Enter") return;

        sendCallback();
    }
</script>

<div class="search-container">
    <input type="text" id="search-box-{ID}" class="search-input" placeholder={placeholder} on:keydown={onKeyDown} />
    <i
        class="search-search-icon fa-solid fa-magnifying-glass"
        on:click={sendCallback}
    ></i>
</div>

<style>
    .search-container {
        position: relative;
        display: block;
        width: 16rem;
        height: 2.3rem;
        background-color: var(--vm-panel-background);
        border: 1px solid var(--vm-panel-border);
        border-radius: 0.7rem;
        margin-bottom: 1rem;
    }

    .search-search-icon {
        color: var(--vm-panel-font-base);
        position: absolute;
        display: block;
        top: 50%;
        right: 4%;
        font-size: 1rem;
        transform: translateY(-50%);
        transition: 0.09s ease-in;
        cursor: pointer;
    }

    .search-search-icon:hover {
        color: var(--vm-panel-font-highlight-mid);
    }

    .search-input,
    .search-input:default,
    .search-input:read-write,
    .search-input:valid,
    .search-input:invalid,
    .search-input:enabled,
    .search-input:disabled,
    .search-input:focus,
    .search-input:open {
        background: transparent;
        background-color: transparent;
        border: none;
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
