import { Map, fromJS } from 'immutable'
import { call, put, select, fork, takeLatest, takeEvery } from 'redux-saga/effects'
import { auth, api } from 'golos-lib-js'
import { Session, signData } from 'golos-lib-js/lib/auth'
import { PrivateKey, Signature, hash } from 'golos-lib-js/lib/auth/ecc'

import g from 'app/redux/GlobalReducer'
import user from 'app/redux/UserReducer'
import { getAccount } from 'app/redux/SagaShared'
import uploadImageWatch from 'app/redux/UserSaga_UploadImage'
import { authApiLogin, authApiLogout } from 'app/utils/AuthApiClient'
import { notifyApiLogin, notifyApiLogout } from 'app/utils/NotifyApiClient'

const session = new Session('msgr_auth')

export function* userWatches() {
    yield fork(loginWatch)
    yield fork(loginErrorWatch)
    yield fork(saveLoginWatch)
    yield fork(logoutWatch)
    yield fork(getAccountWatch)
    yield fork(uploadImageWatch)
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

function* logoutWatch() {
    yield takeLatest('user/LOGOUT', logout);
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

    if (postingWif) {
        let alreadyAuthorized = false;
        try {
            const res = yield notifyApiLogin(username, localStorage.getItem('X-Auth-Session'));
            alreadyAuthorized = (res.status === 'ok');
        } catch(error) {
            // Does not need to be fatal
            console.error('Notify Login Checking Error', error);
            alreadyAuthorized = null;
        }
        if (alreadyAuthorized === false) {
            let authorized = false;
            try {
                const res = yield authApiLogin(username, null);
                if (!res.already_authorized) {
                    console.log('login_challenge', res.login_challenge);

                    const challenge = {token: res.login_challenge};
                    const signatures = signData(JSON.stringify(challenge, null, 0), {
                        posting: postingWif,
                    });
                    const res2 = yield authApiLogin(username, signatures);
                    if (res2.guid) {
                        localStorage.setItem('guid', res2.guid)
                    }
                    if (res2.status === 'ok') {
                        authorized = true;
                    } else {
                        throw new Error(JSON.stringify(res2)); 
                    }
                }
            } catch(error) {
                // Does not need to be fatal
                console.error('Auth Login Error', error);
            }

            if (authorized)
                try {
                    const res = yield notifyApiLogin(username, localStorage.getItem('X-Auth-Session'));

                    if (res.status !== 'ok') {
                        throw new Error(res); 
                    }
                } catch(error) {
                    // Does not need to be fatal
                    console.error('Notify Login Error', error);
                }
        }
    }

    if (!saved && saveLogin && !operationType)
        yield put(user.actions.saveLogin())
}

function* loginError({payload: {/*error*/}}) {
    notifyApiLogout()
    authApiLogout()
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

function* logout() {
    yield put(user.actions.saveLoginConfirm(false)) // Just incase it is still showing
    session.clear()
    notifyApiLogout()
    authApiLogout()
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
