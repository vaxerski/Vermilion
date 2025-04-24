<script lang="ts">
    let spotifyToken = "";
    let spotifyPlayer = undefined;

    window.electronAPI.sendSetting((res) => {
        if (res.setting != "spotifyToken") return;

        spotifyToken = res.value;
    });

    window.electronAPI.spotifyLoggedIn(() => {
        if (spotifyPlayer) {
            spotifyPlayer.disconnect();
            spotifyPlayer = undefined;
        }

        console.log("Spotify logged in, loading the player");

        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;

        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            spotifyPlayer = new window.Spotify.Player({
                name: "Web Playback SDK",
                getOAuthToken: (cb) => {
                    cb(spotifyToken);
                },
                volume: 0.5,
            });

            console.log("spotify: playback init'd");

            spotifyPlayer.addListener("ready", ({ device_id }) => {
                console.log("spotify: ready with Device ID", device_id);
                window.electron.ipcRenderer.send("spotifyDeviceID", device_id);
            });

            spotifyPlayer.addListener("player_state_changed", (state) => {
                if (!state) return;

                // setTrack(state.track_window.current_track);
                // setPaused(state.paused);

                // player.getCurrentState().then((state) => {
                //     !state ? setActive(false) : setActive(true);
                // });
            });

            spotifyPlayer.connect();
        };
    });

    window.electronAPI.spotifyPlayEvent((res) => {
        if (res.volume) spotifyPlayer.setVolume(res.volume);
        if (res.seek) spotifyPlayer.seek(res.seek * 1000);
        if (res.play != undefined) {
            if (res.play) spotifyPlayer.resume();
            else spotifyPlayer.pause();
        }
    });

    setInterval(() => {
        // update the main thread with our elapsed
        spotifyPlayer.getCurrentState().then((res) => {
            window.electron.ipcRenderer.send(
                "spotifyElapsed",
                res.position / 1000,
            );
        });
    }, 500);
</script>
