import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import appReducer from './AppSlice';
import globalReducer from './GlobalSlice';
import transactionReducer from './TransactionSlice';
import userReducer from './UserSlice';

const createRootReducer = (history) => combineReducers({
    router: connectRouter(history),
    app: appReducer,
    global: globalReducer,
    transaction: transactionReducer,
    user: userReducer,
});

export default createRootReducer
