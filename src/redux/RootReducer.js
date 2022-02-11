import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import appReducer from './AppReducer'
import globalReducerModule from './GlobalReducer'
import transactionReducerModule from './TransactionReducer'
import userReducerModule from './UserReducer'

const createRootReducer = (history) => combineReducers({
    router: connectRouter(history),
    app: appReducer,
    global: globalReducerModule.reducer,
    transaction: transactionReducerModule.reducer,
    user: userReducerModule.reducer,
});

export default createRootReducer
