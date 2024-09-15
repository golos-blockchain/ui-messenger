import golos from 'golos-lib-js'
import tt from 'counterpart'

import { getGroupLogo } from 'app/utils/groups'
import { getProfileImage } from 'app/utils/NormalizeProfile';

const { decodeMsgs } = golos.messages

function getProfileImageLazy(contact, account, cachedProfileImages) {
    if (!contact || !contact.contact)
        return getProfileImage(null)
    const now = Date.now()
    let cached = cachedProfileImages[contact.contact];
    if (cached && now - cached.time < 60*1000)
        return cached.image
    console.log('getProfileImageLazy',  contact.contact)
    const image = contact.kind === 'group' ?
        getGroupLogo(contact.object_meta) : getProfileImage(account)
    cachedProfileImages[contact.contact] = { image, time: now }
    return image;
}

const getCache = () => {
    if (!window.preDecoded) window.preDecoded = {}
    return window.preDecoded
}

export const getSpaceInCache = (msg, spaceKey = '') => {
    const preDecoded = getCache()
    const key = spaceKey || (msg.group ? msg.group : '')
    if (!preDecoded[key]) preDecoded[key] = {}
    const space = preDecoded[key]
    return space
}

export const getContactsSpace = (msg) => {
    return getSpaceInCache(msg, 'contacts')
}

const cacheKey = (msg) => {
    let key = [msg.nonce]
    if (msg.group) {
        key.push(msg.receive_date)
        key.push(msg.from)
        key.push(msg.to)
    } else {
        key.push(msg.receive_date)
    }
    key = key.join('|')
    return key
}

export const saveToCache = (msg, contact = false, general = true) => {
    if (!msg.message) return false
    if (msg.group && msg.decrypt_date !== msg.receive_date) return false
    const key = cacheKey(msg)
    if (general) {
        const space = getSpaceInCache(msg)
        space[key] = { message: msg.message }
    }
    if (contact) {
        const cont = getContactsSpace(msg)
        cont[key] = { message: msg.message }
    }
    return true
}

const loadFromCache = (msg, contact = false) => {
    const space = getSpaceInCache(msg)
    const key = cacheKey(msg)
    const pd = space[key]
    if (pd) {
        msg.message = pd.message
        return true
    }
    if (contact) {
        const cont = getContactsSpace(msg)
        const pdc = cont[key]
        if (pdc) {
            msg.message = pdc.message
            return true
        }
    }
    return false
}

export async function normalizeContacts(contacts, accounts, currentUser, cachedProfileImages) {
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

        const isGroup = contact.kind === 'group'
        const { url, isDefault } = getProfileImageLazy(contact,
            account,
            cachedProfileImages)
        if (!isDefault || isGroup) {
            contact.avatar = url
        }

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

                if (loadFromCache(msg, true)) {
                    return true
                }
                return false;
            },
            for_each: (msg) => {
                saveToCache(msg, true)
            },
            on_error: (msg, idx, exception) => {
                console.error(exception)
                msg.message = { body: tt_invalid_message, invalid: true, };
                saveToCache(msg, true, false)
            },
            begin_idx: 0,
            end_idx: messages.length,
        })
    } catch (ex) {
        console.log(ex);
    }

    return contactsCopy
}

export async function normalizeMessages(messages, accounts, currentUser, to) {
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

        console.log('ttt', Date.now())
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
                //msg.decrypt_date = null

                if (loadFromCache(msg)) {
                    results.push(msg)
                    return true
                }
                return false;
            },
            for_each: (msg, i) => {
                saveToCache(msg)
            },
            on_error: (msg, i, err) => {
                console.error(err, msg)
                msg.message = {body: tt_invalid_message, invalid: true}
            },
            begin_idx: messagesCopy.length - 1,
            end_idx: -1,
        })
        console.log('ttte', Date.now())
        return decoded
    } catch (ex) {
        console.log(ex);
        return [];
    }
}