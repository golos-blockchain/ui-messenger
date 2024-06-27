import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import golos, { api } from 'golos-lib-js'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'

export function* fetchDataWatches () {
    yield fork(watchLocationChange)
    yield fork(watchFetchState)
    yield fork(watchFetchUiaBalances)
    yield fork(watchFetchMyGroups)
    yield fork(watchFetchGroupMembers)
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
        state.assets = {}
        state.groups = {}

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

                if (accs[0] && accs[0].frozen) {
                    alert(accs[0].name + ' - ' + tt('loginform_jsx.account_frozen'))
                }
            }
        }

        yield put(g.actions.receiveState(state))
    } catch (err) {
        console.error('fetchDataSaga error', err)
    }
}

export function* watchFetchUiaBalances() {
    yield takeLatest('global/FETCH_UIA_BALANCES', fetchUiaBalances)
}

export function* fetchUiaBalances({ payload: { account } }) {
    try {
        let assets = yield call([api, api.getAccountsBalancesAsync], [account])
        assets = assets && assets[0]
        if (assets) {
            yield put(g.actions.receiveUiaBalances({assets}))
        }
    } catch (err) {
        console.error('fetchUiaBalances', err)
    }
}

export function* watchFetchMyGroups() {
    yield takeLatest('global/FETCH_MY_GROUPS', fetchMyGroups)
}

export function* fetchMyGroups({ payload: { account } }) {
    try {
        const groupsOwn = yield call([api, api.getGroupsAsync], {
            member: account,
            member_types: [],
            start_group: '',
            limit: 100,
            with_members: {
                accounts: [account]
            }
        })
        let groups = yield call([api, api.getGroupsAsync], {
            member: account,
            member_types: ['pending', 'member', 'moder'],
            start_group: '',
            limit: 100,
            with_members: {
                accounts: [account]
            }
        })
        groups = [...groupsOwn, ...groups]

        yield put(g.actions.receiveMyGroups({ groups }))
    } catch (err) {
        console.error('fetchMyGroups', err)
    }
}

export function* watchFetchGroupMembers() {
    yield takeLatest('global/FETCH_GROUP_MEMBERS', fetchGroupMembers)
}

export function* fetchGroupMembers({ payload: { group, creatingNew } }) {
    try {
        if (creatingNew) {
            yield put(g.actions.receiveGroupMembers({ group, members: [], append: true }))
            return
        }

        yield put(g.actions.receiveGroupMembers({ group, loading: true }))

        const members = yield call([api, api.getGroupMembersAsync], {
            group,
            member_types: ['pending', 'member', 'moder'/*, 'banned'*/],
            start_member: '',
            limit: 100,
        })

        yield put(g.actions.receiveGroupMembers({ group, members }))
    } catch (err) {
        console.error('fetchGroupMembers', err)
    }
}