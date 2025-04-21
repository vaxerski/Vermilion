<img align="left" style="width: 64px" src="assets/logo256.png">

## Vermilion

Vermilion is a clean, minimal and simple music player for MPD and Tidal.

> [!NOTE]
> Please note Vermilion is in very early stages of development.
> Bugs are to be expected.


![](./assets/ui1.png) <br/>
![](./assets/ui2.png)


## Features

- Play queue
- Mini / fullscreen player with controls
- Tidal / MPD support
- Listenbrainz integration
- MPRIS integration

### Planned

- Favorites
- Playlists
- arrpc integration
- Possibly a youtube music integration

## Integrations

### MPD

Go to settings and input your mpd server's address and port. That's it.

#### Supported

- Playback
- Volume
- Searching for songs

#### Planned

- Searching for albums / artists
- Browsing artist / album pages

### Tidal

> [!NOTE]
> Tidal playback is supported via widevine and a custom electron version from [castlabs](https://github.com/castlabs/electron-releases).
> This does mean that Digital Rights Management is used to play Tidal content.
>
> Please also do note that Vermilion is not designed to bypass any of Tidal's content restrictions. You will need a paid account to use Tidal within Vermilion, and will be shown your account region's content offering, just like in the official app.

Check the [docs](./docs/Tidal.md) for how to connect Vermilion to Tidal.

#### Supported

- Playback
- Volume
- Searching for songs

#### Planned

- Searching for albums / artists
- Browsing artist / album pages

## Building

See [building.md](./docs/Building.md).

## Disclaimer

Vermilion is in no way associated with Tidal or TIDAL Music AS.
