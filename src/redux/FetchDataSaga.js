import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import golos, { api } from 'golos-lib-js'

import g from 'app/redux/GlobalReducer'

export function* fetchDataWatches () {
    yield fork(watchLocationChange)
    yield fork(watchFetchState)
}

export function* watchLocationChange() {
    yield takeLatest('@@router/LOCATION_CHANGE', fetchState)
}

export function* watchFetchState() {
    yield takeLatest('FETCH_STATE', fetchState)
}

export function* fetchState(location_change_action) {
    try {

        const { pathname } = location_change_action.payload.location
        const { fake } = location_change_action.payload
        const parts = pathname.split('/')

        const state = {}
        state.nodeError = null
        state.contacts = [];
        state.messages = [];
        state.messages_update = '0';
        state.accounts = {}

        let hasErr = false

        if (fake) {
            function* callSafe(state, defValue, logLabel, [context, fn], ...args) {
                try {
                    let res = yield call([context, fn], ...args)
                    return res
                } catch (err) {
                    console.warn('fetchState:', logLabel, err)
                    state.nodeError = { reason: 'fetch', node: golos.config.get('websocket') }
                    yield put(g.actions.receiveState(state))
                    hasErr = true
                    return defValue
                }
            }

            let accounts = new Set()

            const account = yield select(state => state.user.getIn(['current', 'username']));
            if (account) {
                accounts.add(account);

                state.contacts = yield callSafe(state, [], 'getContactsAsync', [api, api.getContactsAsync], account, 'unknown', 100, 0)
                if (hasErr) return

                if (parts[1]) {
                    const to = parts[1].replace('@', '');
                    accounts.add(to);

                    state.messages = yield callSafe(state, [], 'getThreadAsync', [api, api.getThreadAsync], account, to, {});
                    if (hasErr) return

                    if (state.messages.length) {
                        state.messages_update = state.messages[state.messages.length - 1].nonce;
                    }
                }
                for (let contact of state.contacts) {
                    accounts.add(contact.contact);
                }
            }

            if (accounts.size > 0) {
                let accs = yield callSafe(state, [], 'getAccountsAsync', [api, api.getAccountsAsync], Array.from(accounts))
                if (hasErr) return

                for (let i in accs) {
                    state.accounts[ accs[i].name ] = accs[i]
                }
            }
        }

        yield put(g.actions.receiveState(state))
    } catch (err) {
        console.error('fetchDataSaga error', err)
    }
}
