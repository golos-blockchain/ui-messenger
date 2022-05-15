package gls.messenger.core

import android.app.Service
import android.content.Intent
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import org.json.JSONObject
import kotlin.concurrent.thread
import gls.messenger.R

class NotifyService() : Service() {
    companion object {
        private const val TAG = "GLS/NotifyService"

        const val ACTION_STOP = "ACTION_STOP"
    }

    private lateinit var nac: NotifyApiClient
    private lateinit var nh: NotificationHelper
    private lateinit var prefs: AppPrefs
    private var workThread: Thread? = null

    private var subId = ""
    private var nicks = mutableSetOf<String>()
    private var nonces = mutableSetOf<String>()

    private fun showNotification() {
        var descr = "@" + nicks.joinToString(", @")
        descr = "Новое сообщение от $descr"
        Handler(Looper.getMainLooper()).post {
            nh.notifyMessage("GOLOS Мессенджер", descr)
        }
    }

    private fun processInbox() {
        nicks.clear()
        var hasChanges = false
        if (prefs.lastTake != 0L) {
            try {
                nac?.getInbox(prefs.account, prefs.lastTake) { msg: JSONObject ->
                    val nonce = msg.optString("nonce", "")
                    nonces.add(nonce)
                    val from = msg.optString("from", "")
                    if (from != prefs.account) {
                        nicks.add(from)
                        hasChanges = true
                    }
                }
                if (hasChanges) {
                    showNotification()
                }
            } catch (e: Exception) {
                e.printStackTrace()
                throw e
            }
        }
    }
	
    private fun doLoop(removeTaskIds: ArrayList<String>) {
        if (Thread.interrupted()) return

        if (subId.isEmpty()) {
            try {
                subId = nac?.subscribe(prefs.account, "message").toString()
            } catch (e: Exception) {
                e.printStackTrace()
                Thread.sleep(5000)
                doLoop(removeTaskIds)
                return
            }
            Log.i(TAG, "NotifyService subscribed $subId")

            if (Thread.interrupted()) return

            try {
                processInbox()
            } catch (e: Exception) {
                subId = "" // Go resubscribe
                Thread.sleep(5000)
                doLoop(removeTaskIds)
                return
            }
        }

        if (Thread.interrupted()) return

        nicks.clear()
        var hasChanges = false
        val rti = removeTaskIds.joinToString(",")
        var newRTI = ArrayList<String>()
        try {
            val takeRes = nac?.take(prefs.account, subId, { type: String, op: JSONObject ->
                if (type != "private_message") return@take
                val update = op.optBoolean("update", false)
                if (update) return@take

                val nonce = op.optString("nonce", "")
                if (nonces.contains(nonce)) return@take
                val offchain = op.optBoolean("_offchain", false)
                if (offchain) nonces.add(nonce)

                val from = op.optString("from", "")
                if (from != prefs.account) {
                    nicks.add(from)
                    hasChanges = true
                }
            }, rti)
            newRTI = takeRes.removeTaskIds

            if (Thread.interrupted()) return

            prefs.lastTake = takeRes.lastTake
            ServiceHelper.savePrefs(applicationContext, prefs)

            if (hasChanges) {
                showNotification()
            }
        } catch (e: Exception) {
            e.printStackTrace()
            if (e.message != null && e.message!!.contains("No such queue")) {
                Log.e(TAG, "No such queue - resubscribing")
                subId = ""
            }
        }
        Thread.sleep(2500)
        doLoop(newRTI)
    }

    override fun onBind(intent: Intent?): IBinder? {
        return  null
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
		if (intent != null && intent.action == ACTION_STOP) {
            if (workThread != null) {
				workThread!!.interrupt()
                stopForeground(true)
                stopSelfResult(startId)
            }
            return START_STICKY
        }

        nh = NotificationHelper(this)
        val n = nh.makeForeground(" ", "GOLOS Мессенджер работает.", R.drawable.ic_empty)
        startForeground(FOREGROUND_NOTIFICATION_ID, n)

        Log.i(TAG, "Started")

        prefs = ServiceHelper.loadPrefs(applicationContext)
        nac = NotifyApiClient(prefs.notifyHost)
        nac.session = prefs.session

        nicks.clear()

        workThread = thread { 
            try {
                doLoop(ArrayList<String>())
            } catch (e: InterruptedException) {
                Log.i(TAG, "Service stopped - InterruptedException", e)
            }
        }

        return START_STICKY
    }
}
