<script lang="ts">
    import shaka from "shaka-player";

    console.log("Initializing shaka-player for Tidal DRM");

    var shakaPlayer;
    var streamingSessionId;
    var streamingSessionToken;
    var licenseToken;

    setTimeout(() => {
        if (shaka.Player.isBrowserSupported()) {
            console.log(
                "Browser supports shaka-player. Tidal may work. You gotta pray for it to do.",
            );
            setupShaka();
        } else {
            console.log(
                "Browser does not support shaka-player, tidal won't work.",
            );
        }
    }, 50);

    async function setupShaka() {
        const VIDEO = document.getElementById("shaka-player-output");

        console.log(VIDEO);

        shaka.polyfill.installAll();

        shakaPlayer = new shaka.Player();
        await shakaPlayer.attach(VIDEO);
        shakaPlayer.addEventListener("error", (e) => {
            console.error("Shaka player errored out: " + e.code + ": ");
            console.error(e);
        });

        shakaPlayer
            .getNetworkingEngine()
            .registerRequestFilter(function (type, request) {
                if (type != shaka.net.NetworkingEngine.RequestType.LICENSE)
                    return;

                // Tidal wants a json with b64.

                const B64 = btoa(
                    String.fromCharCode(...new Uint8Array(request.body)),
                );
                const json = JSON.stringify({
                    payload: B64,
                    securityToken: licenseToken,
                    streamingSessionId: streamingSessionId,
                });
                request.body = json;

                request.headers["Content-type"] = "application/json";
                request.headers["Content-Length"] = json.length;
                request.headers["authorization"] =
                    "Bearer " + streamingSessionToken;
            });
        shakaPlayer
            .getNetworkingEngine()
            .registerResponseFilter(function (type, response) {
                // IDK what 2 is but I am just reversing this nonstandard tidal's impl lole
                if (type != 2) return;

                // Tidal responds with a json with b64.

                const json = JSON.parse(
                    new TextDecoder("utf-8").decode(response.data),
                );
                const B64 = json.payload;
                const BINARY = atob(B64);
                let bytes = new Uint8Array(BINARY.length);
                for (var i = 0; i < BINARY.length; i++) {
                    bytes[i] = BINARY.charCodeAt(i);
                }

                response.data = bytes;
            });

        console.log("Shaka setup successful.");
    }

    window.electronAPI.playTidal((res) => {
        shakaPlayer.configure({
            drm: {
                servers: {
                    "com.widevine.alpha":
                        "https://listen.tidal.com/v1/drm/licenses/widevine",
                },
            },
        });

        licenseToken = res.licenseToken;
        streamingSessionId = res.sessionId;
        streamingSessionToken = res.token;

        console.log("Sending a play request via shaka + widevine");

        if (shakaPlayer.getManifest()) shakaPlayer.unload();

        shakaPlayer
            .load("data:application/dash+xml;base64," + res.manifest)
            .then((x) => {
                console.log("Shaka returned a success! Enjoy!");
            })
            .catch((e) => {
                console.error("Shaka-player errored out:");
                console.error(e);
            });
    });

    window.electronAPI.tidalPlayEvent((res) => {
        const VIDEO = document.getElementById("shaka-player-output");

        if (res.volume) VIDEO.volume = res.volume;
        if (res.seek) VIDEO.currentTime = res.seek;
        if (res.play != undefined) {
            if (res.play) VIDEO.play();
            else VIDEO.pause();
        }
    });

    setInterval(() => {
        // update the main thread with our elapsed
        const VIDEO = document.getElementById("shaka-player-output");
        window.electron.ipcRenderer.send("tidalElapsed", VIDEO.currentTime);
    }, 500);
</script>

<video id="shaka-player-output" controls autoplay></video>

<style>
    #shaka-player-output {
        visibility: hidden;
        position: absolute;
        top: -100vw;
        left: -100vw;
        width: 1px;
        height: 1px;
        z-index: 0;
    }
</style>
