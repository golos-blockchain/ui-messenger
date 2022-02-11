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
import Messages from './Messages'

const store = configureStore()

class App extends React.Component {
    render() {
        return (
            <Provider store={store}>
                <ConnectedRouter history={history}>
                    <Switch>
                        <Route path='/'>
                            <Messages />
                        </Route>
                        <Route path='/@:to'>
                            <Messages />
                        </Route>
                    </Switch>
                </ConnectedRouter>
            </Provider>
        )
    }
}

export default App
