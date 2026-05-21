import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import appReducer from './AppSlice';
import globalReducerModule from './GlobalReducer'
import transactionReducer from './TransactionSlice';
import userReducer from './UserSlice'

const createRootReducer = (history) => combineReducers({
    router: connectRouter(history),
    app: appReducer,
    global: globalReducerModule.reducer,
    transaction: transactionReducer,
    user: userReducer,
});

export default createRootReducer
