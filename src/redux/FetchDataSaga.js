import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import { api } from 'golos-lib-js'

import g from 'app/redux/GlobalReducer'

export function* fetchDataWatches () {
    yield fork(watchGetContent)
    yield fork(watchLocationChange)
    yield fork(watchFetchState)
}

export function* watchGetContent() {
    yield takeEvery('global/TICK', getContentCaller);
}

export function* getContentCaller(action) {
    console.log('f')
    alert('1')
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
        const parts = pathname.split('/')

        const state = {}
        state.contacts = [];
        state.messages = [];
        state.messages_update = '0';
        state.accounts = {}

        let accounts = new Set()

        const account = yield select(state => state.user.getIn(['current', 'username']));
        if (account) {
            accounts.add(account);

            state.contacts = yield call([api, api.getContactsAsync], account, 'unknown', 100, 0)

            if (parts[1]) {
                const to = parts[1].replace('@', '');
                accounts.add(to);

                state.messages = yield call([api, api.getThreadAsync], account, to, {});
                if (state.messages.length) {
                    state.messages_update = state.messages[state.messages.length - 1].nonce;
                }
            }
            for (let contact of state.contacts) {
                accounts.add(contact.contact);
            }
        }

        if (accounts.size > 0) {
            const acc = yield call([api, api.getAccountsAsync], Array.from(accounts))
            for (let i in acc) {
                state.accounts[ acc[i].name ] = acc[i]
            }
        }

        yield put(g.actions.receiveState(state))
    } catch (err) {
        console.error('fetchDataSaga error', err)
    }
}
