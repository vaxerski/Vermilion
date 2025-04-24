## Spotify integration

Spotify integration runs on top of Spotify's Developer API.

## Linking spotify to Vermilion

- Go to [https://developer.spotify.com/dashboard](https://developer.spotify.com/dashboard) and log in.
- Make a new app.
  - Name and description are up to you, but probably set it to something reasonable, e.g. `Vermilion`.
  - Redirect URI **must** be `https://spotify.com/nonexistent-vermilion`
  - APIs used **must** have `Web API` and `Web Playback SDK` enabled.
- Once your app is created, copy the Client ID and paste it in Vermilion's settings -> Spotify -> Spotify API Client ID
- Click the login button under the spotify client ID
- Log in with your account in the popup
- You're done! :)
