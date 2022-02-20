import { call, put, select, fork, takeEvery } from 'redux-saga/effects'
import { List, fromJS } from 'immutable'
import golos from 'golos-lib-js'

import g from 'app/redux/GlobalReducer'

export function* transactionWatches() {
    yield fork(watchForBroadcast)
}

export function* watchForBroadcast() {
    yield takeEvery('transaction/BROADCAST_OPERATION', broadcastOperation)
}

const hook = {
    preBroadcast_custom_json,
}

function* preBroadcast_custom_json({operation}) {
    const json = JSON.parse(operation.json)
    if (operation.id === 'private_message') {
        if (json[0] === 'private_message') {
            let messages_update;
            yield put(g.actions.update({
                key: ['messages'],
                notSet: List(),
                updater: msgs => {
                    const idx = msgs.findIndex(i => i.get('nonce') === json[1].nonce);
                    if (idx === -1) {
                        msgs = msgs.insert(0, fromJS({
                            nonce: json[1].nonce,
                            checksum: json[1].checksum,
                            from: json[1].from,
                            read_date: '1970-01-01T00:00:00',
                            create_date: new Date().toISOString().split('.')[0],
                            receive_date: '1970-01-01T00:00:00',
                            encrypted_message: json[1].encrypted_message
                        }))
                    } else {
                        messages_update = json[1].nonce;
                        msgs = msgs.update(idx, msg => {
                            msg = msg.set('checksum', json[1].checksum);
                            msg = msg.set('receive_date', '1970-01-01T00:00:00');
                            msg = msg.set('encrypted_message', json[1].encrypted_message);
                            return msg;
                        });
                    }
                    return msgs;
                }
            }))
            if (messages_update) {
                yield put(g.actions.update({
                    key: ['messages_update'],
                    notSet: '0',
                    updater: mu => {
                        return messages_update + 1; // Adding something to not collide with real nonce of last added message
                    }
                }))
            }
        } else if (json[0] === 'private_delete_message') {
            let messages_update = null;
            yield put(g.actions.update({
                key: ['messages'],
                notSet: List(),
                updater: msgs => {
                    const mark_deleting = (idx) => {
                        msgs = msgs.update(idx, msg => {
                            return msg.set('deleting', true);
                        });
                    };
                    if (json[1].nonce) {
                        const idx = msgs.findIndex(msg => msg.get('nonce') === json[1].nonce);
                        if (idx !== -1) {
                            messages_update = json[1].nonce;
                            mark_deleting(idx);
                        }
                    } else {
                        let idx = msgs.findIndex(msg => msg.get('create_date') === json[1].stop_date);
                        if (idx !== -1) {
                            for (; (idx < msgs.size) && (msgs.get(idx).get('create_date') > json[1].start_date); ++idx) {
                                const msg = msgs.get(idx);
                                if (msg.get('create_date') > json[1].start_date)
                                    break;
                                messages_update = msg.get('nonce');
                                mark_deleting(idx);
                            }
                        }
                    }
                    return msgs;
                }
            }))
            if (messages_update) {
                yield put(g.actions.update({
                    key: ['messages_update'],
                    notSet: '0',
                    updater: mu => {
                        return messages_update + 1; // Adding something to not collide with real nonce of last added message
                    }
                }))
            }
        }
    }
    return operation
}

/** Keys, username, and password are not needed for the initial call.  This will check the login and may trigger an action to prompt for the password / key. */
function* broadcastOperation(
    {payload:
        {type, operation, trx, confirm, warning, keys, username, password, hideErrors, successCallback, errorCallback}}) {
    if (trx && !trx.length) {
        return;
    }

    const posting_private = yield select(state => state.user.getIn(['current', 'private_keys', 'posting_private']));
    if (!posting_private) {
        alert('Not authorized')
    }

    let operations = trx || [
        [type, operation]
    ]

    const newOps = []
    for (const [type, operation] of operations) {
        if (hook['preBroadcast_' + type]) {
            const op = yield call(hook['preBroadcast_' + type], {operation, username})
            if (Array.isArray(op))
                for (const o of op)
                    newOps.push(o)
            else
                newOps.push([type, op])
        } else {
            newOps.push([type, operation])
        }
    }
    operations = newOps

    const tx = {
        extensions: [],
        operations
    }
    try {
        const res = yield golos.broadcast.sendAsync(
        tx, [posting_private])
    } catch (err) {
        console.error('Broadcast error', err)
    }
}
