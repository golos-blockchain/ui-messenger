import { call, put, select, fork, cancelled, takeLatest, takeEvery } from 'redux-saga/effects';
import golos, { api, auth } from 'golos-lib-js'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'
import { getSpaceInCache, saveToCache } from 'app/utils/Normalizators'

export function* fetchDataWatches () {
    yield fork(watchLocationChange)
    yield fork(watchFetchState)
    yield fork(watchFetchUiaBalances)
    yield fork(watchFetchMyGroups)
    yield fork(watchFetchTopGroups)
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
        state.the_group = undefined
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

                const posting = yield select(state => state.user.getIn(['current', 'private_keys', 'posting_private']))

                const path = parts[1]

                const conCache = getSpaceInCache(null, 'contacts')

                if (path.startsWith('@')) {
                    console.time('prof: getContactsAsync')
                    const con = yield call([auth, 'withNodeLogin'], { account, keys: { posting },
                        call: async (loginData) => {
                            return await api.getContactsAsync({
                                ...loginData,
                                owner: account, limit: 100,
                                cache: Object.keys(conCache),
                            })
                        }
                    })
                    //alert(JSON.stringify(con))
                    console.log('procc:' + con._dec_processed)
                    state.contacts = con.contacts
                    if (hasErr) return
                    console.timeEnd('prof: getContactsAsync')
                }

                if (path) {
                    if (path.startsWith('@')) {
                        const to = path.replace('@', '');
                        accounts.add(to);

                        state.messages = yield callSafe(state, [], 'getThreadAsync', [api, api.getThreadAsync], account, to, {});
                        if (hasErr) return

                        if (state.messages.length) {
                            state.messages_update = state.messages[state.messages.length - 1].nonce;
                        }
                    } else {
                        console.time('prof: getGroupsAsync')
                        let the_group = yield callSafe(state, [], 'getGroupsAsync', [api, api.getGroupsAsync], {
                            start_group: path,
                            limit: 1,
                            with_members: {
                                accounts: [account]
                            }
                        })
                        if (hasErr) return 
                        if (the_group[0] && the_group[0].name === path) {
                            the_group = the_group[0]
                        } else {
                            the_group = null
                        }
                        state.the_group = the_group
                        console.timeEnd('prof: getGroupsAsync')

                        const space = getSpaceInCache({ group: the_group.name })
                        console.time('prof: getThreadAsync')
                        let query = {
                            group: path,
                            cache: Object.keys(space),
                            contacts: {
                                owner: account, limit: 100,
                                cache: Object.keys(conCache),
                            },
                        }
                        const getThread = async (loginData) => {
                            query = {...query, ...loginData}
                            const th = await api.getThreadAsync(query)
                            return th
                        }
                        let thRes
                        if (the_group && the_group.is_encrypted) {
                            thRes = yield call([auth, 'withNodeLogin'], { account, keys: { posting },
                                call: getThread
                            })
                        } else {
                            thRes = yield call(getThread)
                        }
                        console.log('proc:' + thRes._dec_processed)
                        if (the_group && thRes.error) {
                            the_group.error = thRes.error
                        }
                        state.contacts = thRes.contacts
                        if (thRes.messages) {
                            state.messages = thRes.messages
                            if (state.messages.length) {
                                state.messages_update = state.messages[state.messages.length - 1].nonce;
                            }
                        }
                        console.timeEnd('prof: getThreadAsync')
                    }
                }
                for (let contact of state.contacts) {
                    accounts.add(contact.contact);
                }
            }

            if (accounts.size > 0) {
                let accs
                if (window.accountsCache && window.uac) {
                    console.log('uac')
                    accs = window.accountsCache
                } else {
                        console.time('prof: getAcc')
                    accs = yield callSafe(state, [], 'getAccountsAsync', [api, api.getAccountsAsync], Array.from(accounts),
                        { current: account || '' })
                        console.timeEnd('prof: getAcc')
                window.accountsCache = accs
            }
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

export function* watchFetchTopGroups() {
    yield takeLatest('global/FETCH_TOP_GROUPS', fetchTopGroups)
}

export function* fetchTopGroups({ payload: { account } }) {
    try {
        const groupsWithoutMe = []
        let start_group = ''

        for (let page = 1; page <= 3; ++page) {
            console.log('FTG')
            if (page > 1) {
                groupsWithoutMe.pop()
            }

            const groups = yield call([api, api.getGroupsAsync], {
                sort: 'by_popularity',
                start_group,
                limit: 100,
                with_members: {
                    accounts: [account]
                }
            })

            for (const gro of groups) {
                start_group = gro.name
                if ((gro.member_list.length && gro.member_list[0].account == account) || gro.owner == account) {
                    continue
                }
                groupsWithoutMe.push(gro)
            }

            if (groupsWithoutMe.length >= 10 || groups.length < 100) {
                break
            }
        }

        yield put(g.actions.receiveTopGroups({ groups: groupsWithoutMe }))
    } catch (err) {
        console.error('fetchTopGroups', err)
    }
}

export function* watchFetchGroupMembers() {
    yield takeLatest('global/FETCH_GROUP_MEMBERS', fetchGroupMembers)
}

export function* fetchGroupMembers({ payload: { group, creatingNew, memberTypes, sortConditions } }) {
    try {
        if (creatingNew) {
            yield put(g.actions.receiveGroupMembers({ group, members: [], append: true }))
            return
        }

        yield put(g.actions.receiveGroupMembers({ group, loading: true }))

        const members = yield call([api, api.getGroupMembersAsync], {
            group,
            member_types: memberTypes,
            sort_conditions: sortConditions,
            start_member: '',
            limit: 100,
        })

        yield put(g.actions.receiveGroupMembers({ group, members }))
    } catch (err) {
        console.error('fetchGroupMembers', err)
    }
}