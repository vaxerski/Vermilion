<script lang="ts">
    import { changePageTo } from "../../../../state/sharedState.svelte";

    let {
        name,
        identifier,
        source
    } = $props();

    function onClicked() {
        if (!identifier || identifier == "") return;

        changePageTo("/" + source + "/artist/" + identifier);
    }
</script>

<span class="artist-entry-clickable" onclick={onClicked}>{name}</span>

<style>
    .artist-entry-clickable {
        transition: 0.15s ease-in;
        cursor: pointer;
        padding-right: 0;
        margin-right: -0.16rem;
    }

    .artist-entry-clickable:hover {
        color: var(--vm-panel-font-highlight-mid);
        text-decoration: underline;
    }
</style>
