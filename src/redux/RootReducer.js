import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'

import globalReducerModule from './GlobalReducer'

const createRootReducer = (history) => combineReducers({
    router: connectRouter(history),
    global: globalReducerModule.reducer,
});

export default createRootReducer
