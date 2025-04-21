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
- Now, input `token` into the search box.
- Refresh the page.
- Grab a request that just has the file `token`.
- Go to `request` tab.
- Copy the `client_id` value.
- Paste it into the Client ID setting.
- You're done! Close the tidal web player (_do not_ log out!), restart Vermilion and you can listen to music from Tidal.

> [!NOTE]
> After 24 hours, the login token expires. When it does, if you open your web player before Vermilion, Vermilion
> will no longer be able to log in. You will have to redo this process.
> If you log into Vermilion first, your web player will get logged out.

