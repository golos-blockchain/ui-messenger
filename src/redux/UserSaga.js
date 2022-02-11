import { Map, fromJS } from 'immutable'
import { call, put, select, fork, takeLatest, takeEvery } from 'redux-saga/effects'
import { auth, api } from 'golos-lib-js'
import { Session, signData } from 'golos-lib-js/lib/auth'
import { PrivateKey, Signature, hash } from 'golos-lib-js/lib/auth/ecc'

import g from 'app/redux/GlobalReducer'
import user from 'app/redux/UserReducer'
import { getAccount } from 'app/redux/SagaShared'

const session = new Session('msgr_auth')

export function* userWatches() {
    yield fork(loginWatch)
    yield fork(loginErrorWatch)
    yield fork(saveLoginWatch);
    yield fork(getAccountWatch)

}

function* loginWatch() {
    yield takeLatest('user/USERNAME_PASSWORD_LOGIN', usernamePasswordLogin)
}

function* saveLoginWatch() {
    yield takeLatest('user/SAVE_LOGIN', saveLogin);
}

function* loginErrorWatch() {
    yield takeLatest('user/LOGIN_ERROR', loginError)
}

function* getAccountWatch() {
    yield takeEvery('user/GET_ACCOUNT', getAccountHandler);
}

/**
    @arg {object} action.username
    @arg {object} action.password - Password or WIF private key.  A WIF becomes the posting key, a password can create all three
        key_types: active, owner, posting keys.
*/
function* usernamePasswordLogin(action) {
    let { username, password, saveLogin,
        operationType, afterLoginRedirectToWelcome } = action.payload

    let saved = false
    let postingWif, memoWif

    // login with saved password
    if (!username && !password) {
        const data = session.load()
        if (data) { // auto-login with a low security key (posting key)
            [username, postingWif, memoWif] = data;
            memoWif = memoWif ? memoWif : undefined;
            saved = true;
        }
    } else {
        // no saved password - should logout services if logged in
        // if (!username || !password) {
        //     const offchain_account = yield select(state => state.offchain.get('account'))
        //     if (offchain_account) {
        //         notifyApiLogout()
        //         serverApiLogout()
        //     }
        //     return
        // }

        let role
        [ username, role ] = username.split('/')

        let authRes
        try {
            authRes = yield auth.login(username, password)
        } catch (err) {
            if (err === 'No such account') {
                yield put(user.actions.loginError({ error: 'Username does not exist' }))
                return
            }
            console.error(err)
            alert(err)
            return
        }

        if (authRes.active && !authRes.password && !role) {
            yield put(user.actions.loginError({ error: 'This login gives owner or active permissions and should not be used here.  Please provide a posting only login.' }))
            session.clear()
            return
        }

        if (!authRes.memo && !authRes.posting) {
            yield put(user.actions.loginError({ error: 'Incorrect Password' }))
            return
        }

        postingWif = authRes.posting
        memoWif = authRes.memo
    }

    if (!postingWif && !memoWif) {
        return
    }

    let private_keys = fromJS({})

    if (postingWif) {
        private_keys = private_keys.set('posting_private', PrivateKey.fromWif(postingWif))
    }

    if (memoWif) {
        private_keys = private_keys.set('memo_private', PrivateKey.fromWif(memoWif))
    }

    if (!operationType) {
        yield put(
            user.actions.setUser({
                username,
                private_keys,
            })
        )
    } else {
        // yield put(
        //     user.actions.setUser({
        //         username,
        //         operationType,
        //         vesting_shares: account.get('vesting_shares'),
        //         received_vesting_shares: account.get('received_vesting_shares'),
        //         delegated_vesting_shares: account.get('delegated_vesting_shares')
        //     })
        // )
    }

    if (!saved && saveLogin && !operationType)
        yield put(user.actions.saveLogin())
}

function* loginError({payload: {/*error*/}}) {
    // notifyApiLogout();
    // serverApiLogout();
}

function* saveLogin() {
    const [username, private_keys] = yield select(state => ([
        state.user.getIn(['current', 'username']),
        state.user.getIn(['current', 'private_keys']),
    ]))
    if (!username) {
        session.clear();
        console.error('Not logged in')
        return
    }
    // Save the lowest security key
    const posting_private = private_keys.get('posting_private')
    if (!posting_private) {
        session.clear();
        console.error('No posting key to save?')
        return
    }
    const postingPubkey = posting_private.toPublicKey().toString()
    const memoKey = private_keys.get('memo_private')
    session.save(username, posting_private, memoKey);
}

function* getAccountHandler({ payload: { usernames, resolve, reject }}) {
    if (!usernames) {
        const current = yield select(state => state.user.get('current'))
        if (!current) return
        usernames = [current.get('username')]
    }

    const accounts = yield call([api, api.getAccountsAsync], usernames)
    yield accounts.map((account) => put(g.actions.receiveAccount({ account })))
    if (resolve && accounts[0]) {
        resolve(accounts);
    } else if (reject && !accounts[0]) {
        reject();
    }
}
