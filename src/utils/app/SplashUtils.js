
export function hideSplash() {
    try {
        if (process.env.DESKTOP_APP) {
            if (window.appSplash)
                window.appSplash.contentLoaded()
        }
    } catch (err) {
        console.error('hideSplash', err)
    }
}
