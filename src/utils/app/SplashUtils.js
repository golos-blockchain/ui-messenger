
export function hideSplash() {
    if (process.env.IS_APP) {
        try {
            navigator.splashscreen.hide()
        } catch (err) {
            console.error('hideSplash', err)
        }
    }
}
