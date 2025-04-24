
function randomString(length) {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const VALUES = crypto.getRandomValues(new Uint8Array(length));
    return VALUES.reduce((acc, x) => acc + CHARS[x % CHARS.length], "");
}

function sha256(str) {
    const DATA = new TextEncoder().encode(str)
    return crypto.subtle.digest('SHA-256', DATA);
}

function B64Encode(arr) {
    return btoa(String.fromCharCode(...new Uint8Array(arr)))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

export default {
    randomString,
    sha256,
    B64Encode,
}