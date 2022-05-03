import React from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom'
import { browserHistory } from 'react-router'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'
import golos from 'golos-lib-js'

import configureStore, { history}  from './redux/store'
import DialogManager from 'app/components/elements/common/DialogManager'
import DelayedLoadingIndicator from 'app/components/elements/DelayedLoadingIndicator'
import Modals from 'app/components/modules/Modals'
import Messages from 'app/components/pages/Messages'
import AppSettings, { openAppSettings } from 'app/components/pages/app/AppSettings'
import { callApi } from 'app/utils/ServerApiClient'
import Themifier from 'app/Themifier'
import Translator from 'app/Translator'
import defaultCfg from 'app/app/default_cfg'
import { getShortcutIntent, onShortcutIntent } from 'app/utils/app/ShortcutUtils'

import 'app/App.scss'

const store = configureStore()

const cacheMaxAge = 300*1000 // milliseconds

class App extends React.Component {
    state = {
        config: false
    }
    
    constructor(props) {
        super(props)
        if (window.location.hash === '#app-settings') {
            this.appSettings = true
        }
    }
    
    async checkShortcutIntent() {
        try {
            const intent = await getShortcutIntent()
            const intentId = intent.extras['gls.messenger.id']
            if (intent.extras['gls.messenger.hash'] === '#app-settings' && localStorage.getItem('processed_intent') !== intentId) {
                this.appSettings = true
                localStorage.setItem('processed_intent', intentId)
            }
        } catch (err) {
            console.error('Cannot get shortcut intent', err)
        }
    }

    async componentDidMount() {
        if (process.env.IS_APP) {
            await this.checkShortcutIntent()
            onShortcutIntent(intent => {
                if (intent.extras['gls.messenger.hash'] === '#app-settings')
                    openAppSettings()
            })
        }
        window.IS_MOBILE =
            /android|iphone/i.test(navigator.userAgent) ||
            window.innerWidth < 765;
        if (process.env.IS_APP) {
            await this.loadAppConfig()
        } else {
            if (!await this.loadConfigCache()) {
                await this.loadConfigFromServer()
            }
        }
    }
    
    // mobile
    async loadAppConfig() {
        console.log('Loading app config...')
        let cfg = localStorage.getItem('app_settings')
        if (cfg) {
            try {
                cfg = JSON.parse(cfg)
                // Add here migrations in future, if need
                cfg = { ...defaultCfg, ...cfg }
            } catch (err) {
                console.error('Cannot parse app_settings', err)
                cfg = defaultCfg
            }
        } else {
            cfg = defaultCfg
        }
        if (!cfg.current_node) {
            cfg.current_node = cfg.nodes[0].address
        }
        if (cfg.images.use_img_proxy === undefined) {
            cfg.images.use_img_proxy = true
        }
        window.$GLS_Config = cfg
        await this.initGolos()
    }

    async loadConfigCache() {
        if (typeof(localStorage) === 'undefined') {
            console.error('localStorage is not supported by browser. So caching of server config will not work and it can affect performance')
            return false
        }
        let serverConfig = localStorage.getItem('server_config')
        if (serverConfig) {
            try {
                serverConfig = JSON.parse(serverConfig)
            } catch (error) {
                console.error('Cannot parse server_config! It can affect performance', serverConfig)
                return false
            }
            const now = Date.now()
            if (now - serverConfig.time < cacheMaxAge) {
                window.$GLS_Config = serverConfig.config
                window.$GLS_Config.current_node = window.$GLS_Config.nodes[0].address
                await this.initGolos()
                return true
            }
        }
        console.log('Config cache outdated - loading it from server')
        return false
    }

    async loadConfigFromServer() {
        let res = await callApi('/api/get_config')
        res = await res.json()
        window.$GLS_Config = res
        window.$GLS_Config.current_node = window.$GLS_Config.nodes[0].address
        let serverConfig = {
            config: res,
            time: Date.now()
        }
        serverConfig = JSON.stringify(serverConfig)
        localStorage.setItem('server_config', serverConfig)
        await this.initGolos()
    }

    async initGolos() {
        const node = $GLS_Config.current_node
        golos.config.set('websocket', node)
        const nodeObj = $GLS_Config.nodes.filter(item => item.address === node)
        if (nodeObj[0] && nodeObj[0].chain_id) {
            golos.config.set('chain_id', nodeObj[0].chain_id)
        }
        if (process.env.IS_APP) {
            golos.config.set('node_timeout', 5000)
        }
        await golos.importNativeLib()
        this.setState({
            config: true
        })
    }

    render() {
        if (!this.state.config) {
            return <div style={{ marginTop: '2rem' }}>
                <center>
                    <DelayedLoadingIndicator type='circle' size='25px' delay={1000} />
                </center>
            </div>
        }
        return (
            <Provider store={store}>
                <Translator>
                    <ConnectedRouter history={history}>
                        <Switch>
                            <Route path='/__app_settings'>
                                <Themifier>
                                    <AppSettings />
                                    <DialogManager />
                                </Themifier>
                            </Route>
                            <Route path='/:to?'>
                                {this.appSettings ? <Themifier>
                                        <AppSettings />
                                        <DialogManager />
                                    </Themifier> : <Themifier>
                                        <Messages />
                                        <Modals />
                                        <DialogManager />
                                </Themifier>}
                            </Route>
                        </Switch>
                    </ConnectedRouter>
                </Translator>
            </Provider>
        )
    }
}

export default App
