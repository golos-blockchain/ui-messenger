import golos from 'golos-lib-js'
import tt from 'counterpart'

import { getProfileImage } from 'app/utils/NormalizeProfile';

const { decodeMsgs } = golos.messages

function getProfileImageLazy(account, cachedProfileImages) {
    if (!account)
        return getProfileImage(null);
    let cached = cachedProfileImages[account.name];
    if (cached) 
        return cached;
    const image = getProfileImage(account);
    cachedProfileImages[account.name] = image;
    return image;
}

const cacheKey = (msg) => {
    let key = [msg.nonce]
    if (msg.group) {
        key.push(msg.group)
        key.push(msg.receive_date)
        key.push(msg.from)
        key.push(msg.to)
    } else {
        key.push(msg.receive_date)
    }
    key = key.join('|')
    return key
}

const saveToCache = (preDecoded, msg) => {
    if (!msg.message) return false
    if (msg.group && msg.decrypt_date !== msg.receive_date) return false
    let key = cacheKey(msg)
    preDecoded[key] = { message: msg.message }
    return true
}

const loadFromCache = (preDecoded, msg) => {
    let key = cacheKey(msg)
    let pd = preDecoded[key];
    if (pd) {
        msg.message = pd.message
        return true
    }
    return false
}

export async function normalizeContacts(contacts, accounts, currentUser, preDecoded, cachedProfileImages) {
    if (!currentUser || !accounts)
        return [];

    const currentAcc = accounts[currentUser.get('username')];
    if (!currentAcc)
        return [];

    const posting = currentUser.getIn(['private_keys', 'posting_private'])
    const private_memo = currentUser.getIn(['private_keys', 'memo_private']);

    const tt_invalid_message = tt('messages.invalid_message');

    let contactsCopy = contacts ? [...contacts.toJS()] : [];
    let messages = []
    for (let contact of contactsCopy) {
        let account = accounts && accounts[contact.contact];
        contact.avatar = getProfileImageLazy(account, cachedProfileImages);

        if (contact.last_message.create_date.startsWith('1970')) {
            contact.last_message.message = { body: '', };
            continue;
        }

        messages.push(contact.last_message)
    }

    try {
        await decodeMsgs({ msgs: messages, private_memo,
            login: {
                account: currentAcc.name, keys: { posting },
            },
            before_decode: (msg, idx, results) => {
                if (!msg.isGroup) {
                    if (msg.read_date.startsWith('19') && msg.from === currentAcc.name) {
                        msg.unread = true;
                    }
                }

                if (loadFromCache(preDecoded, msg)) {
                    return true
                }
                return false;
            },
            for_each: (msg) => {
                saveToCache(preDecoded, msg)
            },
            on_error: (msg, idx, exception) => {
                msg.message = { body: tt_invalid_message, invalid: true, };
            },
            begin_idx: 0,
            end_idx: messages.length,
        })
    } catch (ex) {
        console.log(ex);
    }

    return contactsCopy
}

export async function normalizeMessages(messages, accounts, currentUser, to, preDecoded) {
    let isGroup = false
    if (to) {
        if (to[0] !== '@') isGroup = true
        to = to.replace('@', '')
    }

    if (!to || (!isGroup && !accounts[to])) {
        return [];
    }

    let messagesCopy = messages ? [...messages.toJS()] : [];

    let id = 0;
    try {
        let currentAcc = accounts[currentUser.get('username')];

        const tt_invalid_message = tt('messages.invalid_message');

        const posting = currentUser.getIn(['private_keys', 'posting_private'])
        const privateMemo = currentUser.getIn(['private_keys', 'memo_private']);

        console.time('dddm')
        const decoded = await decodeMsgs({ msgs: messagesCopy,
            private_memo: !isGroup && privateMemo,
            login: {
                account: currentAcc.name, keys: { posting },
            },
            before_decode: (msg, i, results) => {
                msg.id = ++id;
                msg.author = msg.from;
                msg.date = new Date(msg.create_date + 'Z');

                if (!isGroup) {
                    if (msg.to === currentAcc.name) {
                        if (msg.read_date.startsWith('19')) {
                            msg.toMark = true;
                        }
                    } else {
                        if (msg.read_date.startsWith('19')) {
                            msg.unread = true;
                        }
                    }
                }
                msg.decrypt_date = null

                if (loadFromCache(preDecoded, msg)) {
                    results.push(msg)
                    return true
                }
                return false;
            },
            for_each: (msg, i) => {
                saveToCache(preDecoded, msg)
            },
            on_error: (msg, i, err) => {
                console.error(err, msg)
                msg.message = {body: tt_invalid_message, invalid: true}
            },
            begin_idx: messagesCopy.length - 1,
            end_idx: -1,
        })
        console.timeEnd('dddm')
        return decoded
    } catch (ex) {
        console.log(ex);
        return [];
    }
}