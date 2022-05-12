import React from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom'
import { browserHistory } from 'react-router'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'

import configureStore, { history}  from './redux/store'
import DialogManager from 'app/components/elements/common/DialogManager'
import DelayedLoadingIndicator from 'app/components/elements/DelayedLoadingIndicator'
import Modals from 'app/components/modules/Modals'
import Messages from 'app/components/pages/Messages'
import AppSettings, { openAppSettings } from 'app/components/pages/app/AppSettings'
import Themifier from 'app/Themifier'
import Translator from 'app/Translator'
import initConfig from 'app/utils/initConfig'
import { getShortcutIntent, onShortcutIntent } from 'app/utils/app/ShortcutUtils'

import 'app/App.scss'

const store = configureStore()

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
        if (process.env.MOBILE_APP) {
            await this.checkShortcutIntent()
            onShortcutIntent(intent => {
                if (intent.extras['gls.messenger.hash'] === '#app-settings')
                    openAppSettings()
            })
        }
        window.IS_MOBILE_DEVICE =
            /android|iphone/i.test(navigator.userAgent) ||
            window.innerWidth < 765;
        await initConfig()
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
