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
import Modals from 'app/components/modules/Modals'
import Messages from 'app/components/pages/Messages'
import { callApi } from 'app/utils/ServerApiClient'
import Translator from './Translator'

import './App.scss'

const store = configureStore()

const cacheMaxAge = 300*1000 // milliseconds

class App extends React.Component {
    state = {
        config: false
    }

    async componentDidMount() {
        if (!await this.loadConfigCache()) {
            await this.loadConfigFromServer()
        }
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
        let serverConfig = {
            config: res,
            time: Date.now()
        }
        serverConfig = JSON.stringify(serverConfig)
        localStorage.setItem('server_config', serverConfig)
        await this.initGolos()
    }

    async initGolos() {
        const nodes = $GLS_Config.nodes
        let node = nodes[0]
        golos.config.set('websocket', node.address)
        if (node.chain_id) {
            golos.config.set('chain_id', node.chain_id)
        }
        await golos.importNativeLib()
        this.setState({
            config: true
        })
    }

    render() {
        if (!this.state.config) {
            return <div>Loading</div>
        }
        return (
            <Provider store={store}>
                <Translator>
                    <ConnectedRouter history={history}>
                        <Switch>
                            <Route path='/:to?'>
                                <div>
                                    <Messages />
                                    <Modals />
                                    <DialogManager />
                                </div>
                            </Route>
                        </Switch>
                    </ConnectedRouter>
                </Translator>
            </Provider>
        )
    }
}

export default App
