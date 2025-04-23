<script>
    import Checkbox from "./settings/Checkbox.svelte";
    import InputBox from "./settings/InputBox.svelte";
    import PageTitle from "./shared/PageTitle.svelte";
</script>

<PageTitle text="Settings" subtext="Just what you need" />

<div class="settings-content">
    <p class="settings-section-text">MPD</p>

    <hr class="settings-section-hr"/>

    <div class="settings-options-box">
        <InputBox
            placeholder={"127.0.0.1"}
            valueName={"mpdAddress"}
            text={"Server Address"}
        />
        <InputBox
            placeholder={"6600"}
            valueName={"mpdPort"}
            text={"Server Port"}
        />
    </div>

    <p class="settings-section-text">Tidal</p>

    <hr class="settings-section-hr"/>

    <div class="settings-options-box">
        <InputBox
            placeholder={"..."}
            valueName={"tidalRefreshToken"}
            text={"Tidal Token"}
            secret={true}
        />
        <InputBox
            placeholder={"..."}
            valueName={"tidalClientID"}
            text={"Tidal Client ID"}
            secret={true}
        />
    </div>

    <p class="settings-section-text">YT Music</p>

    <hr class="settings-section-hr"/>

    <div class="settings-options-box">
        <InputBox
            placeholder={""}
            valueName={"ytCookieSource"}
            text={"Cookie source (if getting blocked, browser name)"}
        />
    </div>

    <p class="settings-section-text">MPRIS</p>

    <hr class="settings-section-hr"/>

    <div class="settings-options-box">
        <Checkbox
            valueName={"mprisEnabled"}
            text={"Enabled"}
        />
    </div>

    <p class="settings-section-text">Listenbrainz</p>

    <hr class="settings-section-hr"/>

    <div class="settings-options-box">
        <Checkbox
            valueName={"lbEnabled"}
            text={"Enabled"}
        />
        <InputBox
            placeholder={"..."}
            valueName={"lbToken"}
            text={"API Token"}
            secret={true}
        />
    </div>
</div>

<style>
    .settings-options-box {
        display: flex;
        position: relative;
        width: 100%;
        height: auto;
        flex-direction: column;
        gap: 0.5rem;
    }

    .settings-section-hr {
        width: 30%;
        height: 1px;
        max-height: 1px;
        background: var(--vm-panel-font-hr);
        margin: 0rem;
        margin-bottom: -0.5rem;
        border: none;
    }

    .settings-content {
        display: flex;
        position: relative;
        border-radius: 1rem;
        padding: 1rem 1rem;
        border: solid var(--vm-panel-border) 1px;
        background: var(--vm-panel-background);
        height: auto;
        margin-top: 1.5rem;
        flex-direction: column;
        gap: 1rem;
    }

    .settings-section-text {
        font-family: var(--vm-panel-font-regular);
        font-size: 0.9rem;
        color: var(--vm-panel-font-base);
        user-select: none;
        font-size: 1.4rem;
        margin-bottom: -1rem;
    }

    .vermilion-grad {
        background: linear-gradient(50deg, rgb(255, 167, 167) 0%, #ff5647 100%);
        background-clip: text;
        color: transparent;
    }
</style>
