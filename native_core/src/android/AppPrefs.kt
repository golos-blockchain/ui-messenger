package gls.messenger.core

data class AppPrefs(
    var account: String = "",
    var session: String = "",
    var lastTake: Long = 0,
    var notifyHost: String = ""
    )