
export function hideSplash() {
    if (process.env.MOBILE_APP) {
        try {
            navigator.splashscreen.hide()
        } catch (err) {
            console.error('hideSplash', err)
        }
    }
}
