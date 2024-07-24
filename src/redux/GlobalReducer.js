import { Map, List, fromJS, fromJSGreedy } from 'immutable';
import createModule from 'redux-modules'
import { Asset } from 'golos-lib-js/lib/utils'

import { processDatedGroup } from 'app/utils/MessageUtils'

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
                // TODO reserved words used in account names, find correct solution
                /*if (!Map.isMap(payload.get('accounts'))) {
                    const accounts = payload.get('accounts');
                    payload = payload.set(
                        'accounts',
                        fromJSGreedy(accounts)
                    );
                }*/
                let new_state = state.set('messages', List());
                new_state = new_state.set('contacts', List());
                return new_state.mergeDeep(payload);
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
                        let idx = contacts.findIndex(i =>
                            i.get('contact') === message.to
                            || i.get('contact') === message.from);
                        if (idx === -1) {
                            let contact = isMine ? message.to : message.from;
                            contacts = contacts.insert(0, fromJS({
                                contact,
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
                return new_state
            },
        },
        {
            action: 'UPDATE_GROUP_MEMBER',
            reducer: (state, { payload: { group, member, member_type } }) => {
                const now = new Date().toISOString().split('.')[0]
                let new_state = state
                new_state = state.updateIn(['groups', group],
                Map(),
                gro => {
                    gro = gro.updateIn(['members', 'data'], List(), mems => {
                        const retiring = member_type === 'retired'
                        const idx = mems.findIndex(i => i.get('account') === member)
                        if (idx !== -1) {
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
                return new_state
            },
        },
        {
            action: 'UPDATE_MEMBER_LIST',
            reducer: (state, { payload: { member_list } }) => {
                let new_state = state
                const updater = (gro) => {
                    const mMap = {}
                    for (const mem of member_list) {
                        const { account } = mem
                        mMap[account] = { ...mMap[account], ...mem }
                    }
                    if (!gro.has('member_list')) {
                        gro = gro.set('member_list', List())
                    }
                    gro = gro.update('member_list', List(), data => {
                        let newList = List()
                        data.forEach((mem, i) => {
                            const acc = mem.get('account')
                            if (mMap[acc]) {
                                if (mMap[acc].member_type !== 'retired') {
                                    const newMem = mem.mergeDeep(fromJS(mMap[acc]))
                                    newList = newList.push(newMem)
                                }
                                delete mMap[acc]
                            } else {
                                newList = newList.push(mem)
                            }
                        })
                        const addVals = Object.values(mMap)
                        for (const av of addVals) {
                            if (av.member_type !== 'retired') {
                                newList = newList.push(fromJS(av))
                            }
                        }
                        return newList
                    })
                    return gro
                }
                new_state = new_state.update('the_group', Map(), gro => {
                    gro = updater(gro)
                    return gro
                })
                return new_state
            },
        },
    ],
})
