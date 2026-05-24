
import { routerMiddleware } from 'connected-react-router'
import { createBrowserHistory } from 'history'
//import logger from 'redux-logger'
import createSagaMiddleware from 'redux-saga'
import { configureStore, isImmutableDefault } from '@reduxjs/toolkit';

import createRootReducer from './RootReducer'
import rootSaga from './RootSaga';

export const history = createBrowserHistory()

export default function configureMyStore() {
    const sagaMiddleware = createSagaMiddleware()
    const store = configureStore({
        reducer: createRootReducer(history),
        middleware: (getDefaultMiddleware) => 
            getDefaultMiddleware({
                serializableCheck: false, 
                // immutableCheck: { // if mixing with immutable.js
                //     isImmutable: (value) => isImmutable(value) || isImmutableDefault(value),
                // },
            }).concat(
                routerMiddleware(history),
                sagaMiddleware,
            ),
    });
    sagaMiddleware.run(rootSaga)
    return store;
}
