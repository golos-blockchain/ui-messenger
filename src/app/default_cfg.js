export default {
    "app_version": "1.1.0",
    "nodes": [
        {
            "address": "wss://apibeta.golos.today/ws"
        },
        {
            "address": "wss://api.golos.id/ws"
        },
        {
            "address": "wss://api.aleksw.space/ws"
        },
        {
            "address": "wss://golos.lexai.top/ws"
        }
    ],
    "images": {
        "img_proxy_prefix": "https://images.golos.today",
        "img_proxy_backup_prefix": "https://steemitimages.com",
        "upload_image": "https://api.imgur.com/3/image",
        "client_id": "6c09ebf8c548126"
    },
    "auth_service": {
        "host": "https://dev.golos.app",
        "custom_client": "blogs"
    },
    "notify_service": {
        "host": "https://devnotify.golos.app",
        "host_ws": "wss://devnotify.golos.app/ws"
    },
    "blogs_service": {
        "host": "https://beta.golos.today"
    },
    "wallet_service": {
        "host": "https://devwallet.golos.today"
    },
    "app_updater": {
        "host": "https://files.golos.app"
    }
}