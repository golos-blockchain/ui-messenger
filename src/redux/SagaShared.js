import { call, put, select, } from 'redux-saga/effects'
import { api } from 'golos-lib-js'

import { receiveAccount } from 'app/redux/GlobalSlice';

export function* getAccount(username, force = false) {
    let account = yield select(state => state.global.accounts[username])
    if (force || !account) {
        [account] = yield call([api, api.getAccountsAsync], [username])
        if(account) {
            yield put(receiveAccount({account}))
        }
    }
    return account
}
