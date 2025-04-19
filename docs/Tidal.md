## Tidal integration

The Tidal integration is _not_ official. Vermilion essentially uses the same APIs as the Tidal web app
or the desktop app.

Can it be detected? Definitely.

Will you be banned? Probably not, but I can't promise anything.

## How to connect Vermilion to Tidal

> [!IMPORTANT]
> Vermilion runs off of your user token. ***DO NOT*** share it with anyone, as it grants anyone with it full access to your account.

To get your token:

- Log into [listen.tidal.com](https://listen.tidal.com). 
- Turn on developer tools (`F12`) and go to the _Network_ tab.
- Input `widevine` into the search box.
- Play a song.
- Click any of the `POST` requests.
- In the headers, find the `authorization` header.
- It should look like this: `Bearer XXXXX` where the `XXXXX` is a _very_ long string.
- Copy that string (without the `Bearer` and the space)
- Paste that string into the `Tidal Token` input box in the Vermilion settings tab.
- You're done! Close the tidal web player (_do not_ log out!) and you can listen to music from Tidal in Vermilion.



