package gls.messenger.core
 
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.util.Log
import org.json.JSONObject
import org.apache.cordova.PluginResult
import kotlin.system.exitProcess
 
class CoreFirebaseService : FirebaseMessagingService() {
    private val TAG = "GLS/FirebaseService"

    init {
    }

    override fun onCreate() {
        super.onCreate()
        Log.d(TAG, "onCreate")
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        super.onMessageReceived(remoteMessage)
        Log.d(TAG, "From: ${remoteMessage.from}")
 
        val data = remoteMessage.data
        if (data.isNotEmpty()) {
            Log.d(TAG, "Message data: $data")
            //CorePlugin.sendMessageToJs(JSONObject(data as Map<*, *>))
        }
    }
 
    override fun onNewToken(token: String) {
        Log.d(TAG, "Refreshed token: $token")
        CorePlugin.sendTokenToJs(token)
    }
}