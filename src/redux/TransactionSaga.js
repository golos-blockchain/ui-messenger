import { call, put, select, fork, takeEvery } from 'redux-saga/effects'
import { List, fromJS } from 'immutable'
import golos from 'golos-lib-js'

import g from 'app/redux/GlobalReducer'
import user from 'app/redux/UserReducer'
import { messageOpToObject } from 'app/utils/Normalizators'
import { translateError } from 'app/utils/translateError'

export function* transactionWatches() {
    yield fork(watchForBroadcast)
}

export function* watchForBroadcast() {
    yield takeEvery('transaction/BROADCAST_OPERATION', broadcastOperation)
}

const hook = {
    preBroadcast_custom_json,
    accepted_custom_json,
}

function* accepted_custom_json({operation}) {
    const json = JSON.parse(operation.json)
    if (operation.id === 'private_message') {
        if (json[0] === 'private_group') {
            yield put(g.actions.upsertGroup(json[1]))
        } else if (json[0] === 'private_group_member') {
            const { name, member, member_type } = json[1]
            yield put(g.actions.updateGroupMember({ group: name, member, member_type, }))
        }
    }
    return operation
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
                        let group = ''
                        const exts = json[1].extensions || []
                        for (const [key, val ] of exts) {
                            if (key === 0) {
                                group = val.group
                                break
                            }
                        }
                        const newMsg = messageOpToObject(json[1], group)
                        msgs = msgs.insert(0, fromJS(newMsg))
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

    if (!keys) keys = ['posting']
    keys = [...new Set(keys)] // remove duplicate
    const idxP = keys.indexOf('posting')
    if (idxP !== -1) {
        const posting = yield select(state => state.user.getIn(['current', 'private_keys', 'posting_private']));
        if (!posting) {
            alert('Not authorized')
        }
        keys[idxP] = posting
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
        tx, keys)
        for (const [type, operation] of operations) {
            if (hook['accepted_' + type]) {
                try {
                    yield call(hook['accepted_' + type], {operation})
                } catch (error) {
                    console.error(error)
                }
            }
        }
    } catch (err) {
        console.error('Broadcast error', err)
        if (errorCallback) {
            let errStr = err.toString()
            errStr = translateError(errStr, err.payload)
            errStr = errStr.substring(0, 160)
            errorCallback(err, errStr)
        }
        return
    }

    if (successCallback) {
        successCallback()
    }
}
