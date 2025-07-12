import React from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Route
} from 'react-router-dom'
import { Provider } from 'react-redux'
import { ConnectedRouter } from 'connected-react-router'

import configureStore, { history}  from './redux/store'
import AppReminder from 'app/components/elements/app/AppReminder'
import DialogManager from 'app/components/elements/common/DialogManager'
import DelayedLoadingIndicator from 'app/components/elements/DelayedLoadingIndicator'
import Modals from 'app/components/modules/Modals'
import Messages from 'app/components/pages/Messages'
import AppSettings, { openAppSettings } from 'app/components/pages/app/AppSettings'
import Themifier from 'app/Themifier'
import Translator from 'app/Translator'
import initConfig from 'app/utils/initConfig'
import RenderError from 'app/utils/RenderError'
import { getShortcutIntent, onShortcutIntent } from 'app/utils/app/ShortcutUtils'

import 'app/App.scss'

const store = configureStore()

const APP_REMINDER_INTERVAL = 30*24*60*60*1000

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

    componentDidCatch(err, info) {
        console.error('Render error:', err, info)
        const errStr = (err && err.toString()) ? err.toString() : JSON.stringify(err)
        const infoStr = (info && info.componentStack) || JSON.stringify(info)
        this.setState({
            fatalErr: {
                errStr,
                infoStr
            }
        })
        //alert(';( Ошибка рендеринга\n\n' + errStr + '\n' + infoStr)
        //throw err
    }

    showAppReminder = () => {
        if (process.env.MOBILE_APP || process.env.DESKTOP_APP) {
            return
        }
        const now = Date.now()
        let reminded = localStorage.getItem('app_reminder') || 0
        reminded = parseInt(reminded)
        return !reminded || (now - reminded > APP_REMINDER_INTERVAL)
    }

    render() {
        if (!this.state.config) {
            return <div style={{ marginTop: '2rem' }}>
                <center>
                    <DelayedLoadingIndicator type='circle' size='25px' delay={1000} />
                </center>
            </div>
        }
        const reminder = this.showAppReminder() ? <AppReminder /> : null
        const { fatalErr } = this.state
        return (
            <Provider store={store}>
                <Translator>
                    {fatalErr ? <RenderError error={fatalErr} /> : <ConnectedRouter history={history}>
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
                                        {reminder}
                                </Themifier>}
                            </Route>
                        </Switch>
                    </ConnectedRouter>}
                </Translator>
            </Provider>
        )
    }
}

export default App
