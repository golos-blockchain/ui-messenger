import { fromJS } from 'immutable'
import { call, put, select, } from 'redux-saga/effects'
import { api } from 'golos-lib-js'

import g from 'app/redux/GlobalReducer'

export function* getAccount(username, force = false) {
    let account = yield select(state => state.global.get('accounts').get(username))
    if (force || !account) {
        [account] = yield call([api, api.getAccountsAsync], [username])
        if(account) {
            account = fromJS(account)
            yield put(g.actions.receiveAccount({account}))
        }
    }
    return account
}
