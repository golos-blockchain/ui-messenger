
import { createBrowserHistory } from 'history'
import { createStore, applyMiddleware } from 'redux'
import { routerMiddleware } from 'connected-react-router'
import createSagaMiddleware from 'redux-saga'
import logger from 'redux-logger'

import createRootReducer from './RootReducer'
import rootSaga from './RootSaga';

export const history = createBrowserHistory()

export default function configureStore() {
    const sagaMiddleware = createSagaMiddleware()

    let middleware = applyMiddleware(
        routerMiddleware(history),
        logger,
        sagaMiddleware)

    const store = createStore(createRootReducer(history), middleware)
    sagaMiddleware.run(rootSaga)

    return store
}
