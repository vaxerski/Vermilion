## YT Music integration

YT Music integration runs on top of `yt-dlp`. If you don't have it installed, it will not work.

It also has some notable issues:

### IP range blocks

Certain IP ranges (esp. VPNs) are blocked from youtube without a logged in account.
In such cases, although playback and search can work (see settings > ytm cookie source)
getting the metadata does not properly work, so the miniplayer will be quite impaired.

### Bans

In general, some people claim to have been IP / Account banned for downloading youtube content,
but it's rare, and most people agree what you might get for abuse is `429 Too Many Requests`, which
is a ratelimit.

Don't abuse this and you should be fine, but _you are doing this at your own risk_!