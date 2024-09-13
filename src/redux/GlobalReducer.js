import { Map, List, fromJS, fromJSGreedy } from 'immutable';
import createModule from 'redux-modules'
import { Asset } from 'golos-lib-js/lib/utils'

import { session } from 'app/redux/UserSaga'
import { opGroup } from 'app/utils/groups'
import { processDatedGroup } from 'app/utils/MessageUtils'

const updateInMyGroups = (state, group, groupUpdater, groupsUpserter = mg => mg) => {
    state = state.update('my_groups', null, mg => {
        if (!mg) return mg
        const i = mg.findIndex(gro => gro.get('name') === group)
        if (i === -1) return groupsUpserter(mg)
        mg = mg.update(i, (gro) => {
            if (!gro) return

            return groupUpdater(gro)
        })
        return mg
    })
    return state
}

const updateTheGroup = (state, group, groupUpdater) => {
    state = state.update('the_group', null, (gro) => {
        if (!gro) return
        if (gro.get('name') !== group) return gro

        return groupUpdater(gro)
    })
    return state
}

export default createModule({
    name: 'global',
    initialState: new Map({
        accounts: fromJS({}) // TODO: should be init by FetchDataSaga
    }),
    transformations: [
        {
            action: 'RECEIVE_ACCOUNT',
            reducer: (state, { payload: { account } }) => {
                account = fromJS(account);
                return state.updateIn(
                    ['accounts', account.get('name')],
                    Map(),
                    a => a.mergeDeep(account)
                );
            },
        },
        {
            action: 'RECEIVE_STATE',
            reducer: (state, action) => {
                let payload = fromJS(action.payload);
                payload = payload.update('accounts', accs => {
                    let newMap = Map()
                    accs.forEach((acc, name) => {
                        if (!acc.has('relations')) {
                            acc = acc.set('relations', Map())
                        }
                        if (!acc.hasIn(['relations', 'me_to_them'])) {
                            acc = acc.setIn(['relations', 'me_to_them'], null)
                        }
                        if (!acc.hasIn(['relations', 'they_to_me'])) {
                            acc = acc.setIn(['relations', 'they_to_me'], null)
                        }
                        newMap = newMap.set(name, acc)
                    })
                    return newMap
                })
                let new_state = state.set('messages', List());
                new_state = new_state.set('contacts', List());
                new_state = new_state.mergeDeep(payload)
                return new_state
            },
        },
        {
            action: 'UPDATE',
            reducer: (state, { payload: { key, notSet = Map(), updater } }) =>
                // key = Array.isArray(key) ? key : [key] // TODO enable and test
                state.updateIn(key, notSet, updater),
        },
        {
            action: 'MESSAGED',
            reducer: (
                state,
                { payload: { message, timestamp, updateMessage, isMine } }
            ) => {
                message.create_date = timestamp;
                message.receive_date = timestamp;
                message.read_date = '1970-01-01T00:00:00';
                if (!message.donates) {
                    message.donates = '0.000 GOLOS'
                    message.donates_uia = 0
                }
                const group = opGroup(message)
                message.group = group

                let new_state = state;
                let messages_update = message.nonce;
                if (updateMessage) {
                    new_state = new_state.updateIn(['messages'],
                    List(),
                    messages => {
                        const idx = messages.findIndex(i => i.get('nonce') === message.nonce);
                        if (idx === -1) {
                            messages = messages.insert(0, fromJS(message));
                        } else {
                            messages = messages.set(idx, fromJS(message));
                        }
                        return messages;
                    });
                }
                new_state = new_state.set('messages_update', messages_update);
                new_state = new_state.updateIn(['contacts'],
                    List(),
                    contacts => {
                        let idx = contacts.findIndex(i => {
                            if (group) {
                                return i.get('kind') === 'group' && i.get('contact') === group
                            }
                            return i.get('kind') !== 'group' &&
                                (i.get('contact') === message.to
                                || i.get('contact') === message.from)
                        })
                        if (idx === -1) {
                            let contact = group || (isMine ? message.to : message.from)
                            contacts = contacts.insert(0, fromJS({
                                contact,
                                kind: group ? 'group' : 'account',
                                last_message: message,
                                size: {
                                    unread_inbox_messages: !isMine ? 1 : 0,
                                },
                            }));
                        } else {
                            contacts = contacts.update(idx, contact => {
                                contact = contact.set('last_message', fromJS(message));
                                if (!isMine && !updateMessage) {
                                    let msgs = contact.getIn(['size', 'unread_inbox_messages']);
                                    contact = contact.setIn(['size', 'unread_inbox_messages'],
                                        msgs + 1);
                                }
                                return contact
                            });
                        }
                        const strCmp = (a, b) => a < b ? 1 : a > b ? -1 : 0
                        contacts = contacts.sort((a, b) => {
                            return strCmp(a.getIn(['last_message', 'receive_date']),
                                b.getIn(['last_message', 'receive_date']));
                        });
                        return contacts;
                    });
                return new_state;
            },
        },
        {
            action: 'MESSAGE_EDITED',
            reducer: (
                state,
                { payload: { message, timestamp, updateMessage, isMine } }
            ) => {
                let new_state = state;
                let messages_update = message.nonce;
                if (updateMessage) {
                    new_state = new_state.updateIn(['messages'],
                    List(),
                    messages => {
                        const idx = messages.findIndex(i => i.get('nonce') === message.nonce);
                        if (idx !== -1) {
                            messages = messages.update(idx, (obj) => {
                                obj = obj.set('receive_date', timestamp);
                                obj = obj.set('checksum', message.checksum);
                                obj = obj.set('encrypted_message', message.encrypted_message);
                                return obj;
                            });
                        }
                        return messages;
                    });
                }
                new_state = new_state.set('messages_update', messages_update + 2);
                return new_state;
            },
        },
        {
            action: 'MESSAGE_READ',
            reducer: (
                state,
                { payload: { message, timestamp, updateMessage, isMine } }
            ) => {
                let new_state = state;
                let messages_update = message.nonce || Math.random();
                if (updateMessage) {
                    new_state = new_state.updateIn(['messages'],
                    List(),
                    messages => {
                        return processDatedGroup(message, messages, (msg, idx) => {
                            return msg.set('read_date', timestamp);
                        });
                    });
                }
                new_state = new_state.updateIn(['contacts'],
                    List(),
                    contacts => {
                        let idx = contacts.findIndex(i =>
                            i.get('contact') === (isMine ? message.to : message.from));
                        if (idx !== -1) {
                            contacts = contacts.update(idx, contact => {
                                 // to update read_date (need for isMine case), and more actualize text
                                let last = contact.get('last_message');
                                if (last && last.get('nonce') == message.nonce) {
                                    contact = contact.update('last_message', obj => {
                                        return obj.set('read_date', timestamp);
                                    });
                                }

                                // currently used only !isMine case
                                const msgsKey = isMine ? 'unread_outbox_messages' : 'unread_inbox_messages';
                                contact = contact.setIn(['size', msgsKey], 0);
                                return contact;
                            });
                        }
                        return contacts;
                    });
                new_state = new_state.set('messages_update', messages_update + 1);
                return new_state;
            },
        },
        {
            action: 'MESSAGE_DELETED',
            reducer: (
                state,
                { payload: { message, updateMessage/*, isMine*/ } }
            ) => {
                let new_state = state;
                if (updateMessage) {
                    new_state = new_state.updateIn(['messages'],
                    List(),
                    messages => {
                        const idx = messages.findIndex(i => i.get('nonce') === message.nonce);
                        if (idx !== -1) {
                            messages = messages.delete(idx);
                        }
                        return messages;
                    });
                }
                return new_state;
            },
        },
        {
            action: 'MESSAGE_DONATED',
            reducer: (
                state,
                { payload: { op, updateMessage, isMine } }
            ) => {
                let new_state = state
                if (updateMessage) {
                    const { from, to, nonce } = op.memo.target
                    const amount = Asset(op.amount)
                    new_state = new_state.updateIn(['messages'],
                    List(),
                    messages => {
                        const idx = messages.findIndex(i => i.get('nonce') === nonce);
                        if (idx !== -1) {
                            messages = messages.update(idx, (obj) => {
                                if (!amount.isUIA) {
                                    const donates = Asset(obj.get('donates')).plus(amount)
                                    obj = obj.set('donates', donates.toString())
                                } else {
                                    let donates_uia = parseInt(obj.get('donates_uia'))
                                    donates_uia += parseInt(amount.amountFloat.split('.')[0])
                                    obj = obj.set('donates_uia', donates_uia)
                                }
                                return obj;
                            });
                        }
                        return messages;
                    })
                    new_state = new_state.set('messages_update', Math.random())
                } else if (!isMine) {
                    const { from, to, nonce } = op.memo.target
                    new_state = new_state.updateIn(['contacts'],
                    List(),
                    contacts => {
                        let idx = contacts.findIndex(i =>
                            i.get('contact') === to
                            || i.get('contact') === from)
                        if (idx !== -1) {
                            contacts = contacts.update(idx, contact => {
                                contact = contact.set('unread_donate', true)
                                return contact
                            })
                        }
                        return contacts
                    })
                    new_state = new_state.set('messages_update', Math.random())
                }
                return new_state
            },
        },
        {
            action: 'FETCH_UIA_BALANCES',
            reducer: state => state,
        },
        {
            action: 'RECEIVE_UIA_BALANCES',
            reducer: (state, { payload: { assets } }) => {
                return state.set('assets', fromJS(assets))
            },
        },
        {
            action: 'FETCH_MY_GROUPS',
            reducer: state => state
        },
        {
            action: 'RECEIVE_MY_GROUPS',
            reducer: (state, { payload: { groups } }) => {
                return state.set('my_groups', fromJS(groups))
            },
        },
        {
            action: 'FETCH_TOP_GROUPS',
            reducer: state => state
        },
        {
            action: 'RECEIVE_TOP_GROUPS',
            reducer: (state, { payload: { groups } }) => {
                return state.set('top_groups', fromJS(groups))
            },
        },
        {
            action: 'FETCH_GROUP_MEMBERS',
            reducer: state => state
        },
        {
            action: 'RECEIVE_GROUP_MEMBERS',
            reducer: (state, { payload: { group, members, loading, append } }) => {
                let new_state = state
                new_state = state.updateIn(['groups', group],
                Map(),
                gro => {
                    gro = gro.updateIn(['members'], Map(), mems => {
                        mems = mems.set('loading', loading || false)
                        if (append) {
                            // Immutable's: update do not wants to add notSet, if array is empty...
                            if (!mems.has('data')) {
                                mems = mems.set('data', List())
                            }
                            mems = mems.update('data', List(), data => {
                                for (const item of (members || [])) {
                                    data = data.push(fromJS(item))
                                }
                                return data
                            })
                        } else {
                            mems = mems.set('data', fromJS(members || []))
                        }
                        return mems
                    })
                    return gro
                })
                for (const mem of (members || [])) {
                    if (mem.account_data) {
                        const account = fromJS(mem.account_data)
                        new_state = new_state.updateIn(
                            ['accounts', account.get('name')],
                            Map(),
                            a => a.mergeDeep(account)
                        )
                    }
                }
                return new_state
            },
        },
        {
            action: 'UPSERT_GROUP',
            reducer: (state, { payload }) => {
                const { creator, name, is_encrypted, privacy, json_metadata } = payload
                let new_state = state
                const groupUpdater = gro => {
                    gro = gro.set('json_metadata', json_metadata)
                    gro = gro.set('privacy', privacy)
                    return gro
                }
                const groupsUpserter = myGroups => {
                    const now =  new Date().toISOString().split('.')[0]
                    myGroups = myGroups.insert(0, fromJS({
                        owner: creator,
                        name,
                        json_metadata,
                        is_encrypted,
                        privacy,
                        created: now,
                        admins: 0,
                        moders: 0,
                        members: 0,
                        pendings: 0,
                        banneds: 0,
                        member_list: []
                    }))
                    return myGroups
                }
                new_state = updateInMyGroups(new_state, name, groupUpdater, groupsUpserter)
                new_state = updateTheGroup(new_state, name, groupUpdater)
                return new_state
            }
        },
        {
            action: 'UPDATE_GROUP_MEMBER',
            reducer: (state, { payload: { group, member, member_type } }) => {
                const now = new Date().toISOString().split('.')[0]
                let new_state = state
                let oldType
                new_state = state.updateIn(['groups', group],
                Map(),
                gro => {
                    gro = gro.updateIn(['members', 'data'], List(), mems => {
                        const retiring = member_type === 'retired'
                        const idx = mems.findIndex(i => i.get('account') === member)
                        if (idx !== -1) {
                            oldType = mems.get(idx).get('member_type')
                            if (retiring) {
                                mems = mems.remove(idx)
                            } else {
                                mems = mems.update(idx, mem => {
                                    mem = mem.set('member_type', member_type)
                                    return mem
                                })
                            }
                        } else if (!retiring) {
                            mems = mems.insert(0, fromJS({
                                group,
                                account: member,
                                json_metadata: '{}',
                                member_type,
                                invited: member,
                                joined: now,
                                updated: now,
                            }))
                        }
                        return mems
                    })
                    return gro
                })
                const groupUpdater = gro => {
                    if (!gro.has('member_list')) {
                        gro = gro.set('member_list', List())
                    }
                    gro = gro.update('member_list', List(), data => {
                        let newList = List()
                        let found
                        data.forEach((mem, i) => {
                            if (mem.get('account') === member) {
                                found = true
                                if (!oldType) oldType = mem.get('member_type')
                                if (member_type !== 'retired') {
                                    const newMem = mem.set('member_type', member_type)
                                    newList = newList.push(newMem)
                                }
                            } else {
                                newList = newList.push(mem)
                            }
                        })
                        if (!found) {
                            newList = newList.push(fromJS({
                                account: member,
                                member_type,
                            }))
                        }
                        return newList
                    })

                    const updateByType = (t, updater) => {
                        if (t === 'member') {
                            gro = gro.update('members', updater)
                        } else if (t === 'moder') {
                            gro = gro.update('moders', updater)
                        } else if (t === 'pending') {
                            gro = gro.update('pendings', updater)
                        } else if (t === 'banned') {
                            gro = gro.update('banneds', updater)
                        }
                    }
                    updateByType(oldType, n => --n)
                    updateByType(member_type, n => ++n)

                    return gro
                }
                new_state = updateInMyGroups(new_state, group, groupUpdater)
                new_state = updateTheGroup(new_state, group, groupUpdater)
                new_state = new_state.updateIn(['accounts', member],
                Map(),
                acc => {
                    acc = acc.set('member_type', member_type)
                    return acc
                })
                return new_state
            },
        },
        {
            action: 'UPDATE_BLOCKING',
            reducer: (state, { payload: { blocker, blocking, block } }) => {
                let username
                const sess = session.load()
                if (sess) username = sess[0]
                const account = blocker === username ? blocking : blocker

                let new_state = state.updateIn(['accounts', account],
                Map(),
                acc => {
                    if (!acc.has('relations')) {
                        acc = acc.set('relations', Map())
                    }
                    const path = ['relations', blocker === username ? 'me_to_them' : 'they_to_me']
                    if (block) {
                        acc = acc.setIn(path, 'blocking')
                    } else {
                        acc = acc.deleteIn(path)
                    }
                    return acc
                })

                return new_state
            },
        },
    ],
})
