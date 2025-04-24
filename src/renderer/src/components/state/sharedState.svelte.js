
// FIXME: this sucks lol
export const currentPage = $state({
    page: "/",
    pageTidal: "",
    pageSpotify: "",
    pagePlaylists: "",
});
export const playerData = $state({ fullscreen: false });

export function changePageTo(page) {

    if (page.indexOf("/tidal") == 0)
        currentPage.pageTidal = page;
    else if (page.indexOf("/spotify") == 0)
        currentPage.pageSpotify = page;
    else if (page.indexOf("/playlist") == 0)
        currentPage.pagePlaylists = page;

    currentPage.page = page;

    window.electron.ipcRenderer.send("pageGotUpdated", page);
}

export function prettyTime(time) {
    if (time <= 0) return "0:00";
    let mins = Math.floor(time / 60);
    let secs = Math.floor(time - mins * 60);
    if (mins > 60) {
        let hrs = Math.floor(mins / 60);
        mins -= hrs * 60;
        return (
            hrs +
            ":" +
            (mins > 9 ? mins : "0" + mins) +
            ":" +
            (secs > 9 ? secs : "0" + secs)
        );
    }
    return secs > 9 ? mins + ":" + secs : mins + ":0" + secs;
}