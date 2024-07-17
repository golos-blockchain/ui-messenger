import golos from 'golos-lib-js'
import tt from 'counterpart'

import { getProfileImage } from 'app/utils/NormalizeProfile';

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

export function normalizeContacts(contacts, accounts, currentUser, preDecoded, cachedProfileImages) {
    if (!currentUser || !accounts)
        return [];

    const currentAcc = accounts[currentUser.get('username')];
    if (!currentAcc)
        return [];

    const private_key = currentUser.getIn(['private_keys', 'memo_private']);

    const tt_invalid_message = tt('messages.invalid_message');

    let contactsCopy = contacts ? [...contacts.toJS()] : [];
    for (let contact of contactsCopy) {
        let account = accounts && accounts[contact.contact];
        contact.avatar = getProfileImageLazy(account, cachedProfileImages);

        if (contact.last_message.create_date.startsWith('1970')) {
            contact.last_message.message = { body: '', };
            continue;
        }

        let public_key;
        if (currentAcc.memo_key === contact.last_message.to_memo_key) {
            public_key = contact.last_message.from_memo_key;
        } else {
            public_key = contact.last_message.to_memo_key;
        }

        try {
            golos.messages.decode(private_key, public_key, [contact.last_message],
                (msg, idx, results) => {
                    if (msg.read_date.startsWith('19') && msg.from === currentAcc.name) {
                        msg.unread = true;
                    }
                    let pd = preDecoded[msg.nonce + '' + msg.receive_date];
                    if (pd) {
                        msg.message = pd;
                        return true;
                    }
                    return false;
                }, (msg) => {
                    preDecoded[msg.nonce + '' + msg.receive_date] = msg.message;
                }, (msg, idx, exception) => {
                    msg.message = { body: tt_invalid_message, invalid: true, };
                }, 0, 1);
        } catch (ex) {
            console.log(ex);
        }
    }
    return contactsCopy
}

export function normalizeMessages(messages, accounts, currentUser, to, preDecoded) {
    if (to) to = to.replace('@', '')

    if (!to || !accounts[to]) {
        return [];
    }

    let messagesCopy = messages ? [...messages.toJS()] : [];

    let id = 0;
    try {
        const private_key = currentUser.getIn(['private_keys', 'memo_private']);

        let currentAcc = accounts[currentUser.get('username')];

        const tt_invalid_message = tt('messages.invalid_message');

        let messagesCopy2 = golos.messages.decode(private_key, accounts[to].memo_key, messagesCopy,
            (msg, i, results) => {
                msg.id = ++id;
                msg.author = msg.from;
                msg.date = new Date(msg.create_date + 'Z');

                if (msg.to === currentAcc.name) {
                    if (msg.read_date.startsWith('19')) {
                        msg.toMark = true;
                    }
                } else {
                    if (msg.read_date.startsWith('19')) {
                        msg.unread = true;
                    }
                }

                let pd = preDecoded[msg.nonce + '' + msg.receive_date];
                if (pd) {
                    msg.message = pd;
                    results.push(msg);
                    return true;
                }
                return false;
            },
            (msg) => {
                preDecoded[msg.nonce + '' + msg.receive_date] = msg.message;
            },
            (msg, i, err) => {
                console.log(err);
                msg.message = {body: tt_invalid_message, invalid: true};
            },
            messagesCopy.length - 1, -1);

        return messagesCopy2;
    } catch (ex) {
        console.log(ex);
        return [];
    }
}