import { call, put, select, fork, takeEvery } from 'redux-saga/effects'
import golos from 'golos-lib-js'

export function* transactionWatches() {
    yield fork(watchForBroadcast)
}

export function* watchForBroadcast() {
    yield takeEvery('transaction/BROADCAST_OPERATION', broadcastOperation)
}

/** Keys, username, and password are not needed for the initial call.  This will check the login and may trigger an action to prompt for the password / key. */
function* broadcastOperation(
    {payload:
        {type, operation, trx, confirm, warning, keys, username, password, hideErrors, successCallback, errorCallback}}) {
    let op;
    if (trx) {
        if (!trx.length) {
            return;
        }
        op = trx[0];
    } else {
        op = operation;
    }

    const posting_private = yield select(state => state.user.getIn(['current', 'private_keys', 'posting_private']));
    if (!posting_private) {
        alert('Not authorized')
    }

    const tx = {
        extensions: [],
        operations: [
            [type, op]
        ]
    }
    try {
        const res = yield golos.broadcast.sendAsync(
        tx, [posting_private])
        alert('sent')
    } catch (err) {
        console.error('Broadcast error', err)
    }
}
