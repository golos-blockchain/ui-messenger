import { createSlice } from '@reduxjs/toolkit';
import merge from 'lodash/merge';
import { Asset } from 'golos-lib-js/lib/utils';

import { session } from 'app/redux/UserSaga';
import { opGroup } from 'app/utils/groups';
import { processDatedGroup, opDeleteContact } from 'app/utils/MessageUtils';

const updateInMyGroups = (state, group, groupUpdater, groupsUpserter = mg => mg) => {
    if (!state.my_groups) return;
    
    const i = state.my_groups.findIndex(gro => gro.name === group);
    if (i === -1) {
        groupsUpserter(state.my_groups);
        return;
    }
    
    const gro = state.my_groups[i];
    if (gro) {
        state.my_groups[i] = groupUpdater(gro);
    }
};

const updateTheGroup = (state, group, groupUpdater) => {
    if (!state.the_group) return;
    if (state.the_group.name !== group) return;
    
    state.the_group = groupUpdater(state.the_group);
};

const globalSlice = createSlice({
    name: 'global',
    initialState: {
        accounts: {} // TODO: should be init by FetchDataSaga
    },
    reducers: {
        receiveAccount: (state, { payload: { account } }) => {
            const name = account.name;
            if (!state.accounts[name]) {
                state.accounts[name] = {};
            }
            state.accounts[name] = merge(state.accounts[name], account);
        },

        receiveState: (state, action) => {
            let payload = action.payload;
    
            // Process accounts
            if (payload.accounts) {
                Object.keys(payload.accounts).forEach(name => {
                    if (!payload.accounts[name].relations) {
                        payload.accounts[name].relations = {};
                    }
                    if (!payload.accounts[name].relations.me_to_them) {
                        payload.accounts[name].relations.me_to_them = null;
                    }
                    if (!payload.accounts[name].relations.they_to_me) {
                        payload.accounts[name].relations.they_to_me = null;
                    }
                });
            }
    
            // Reset certain fields
            state.messages = [];
            state.contacts = [];
            delete state.the_group;
    
            // Deep merge payload into state
            merge(state, payload);
        },

        update: (state, { payload: { key, notSet = {}, updater } }) => {
            // Navigate to nested path
            const keys = Array.isArray(key) ? key : [key];
            let current = state;
    
            for (let i = 0; i < keys.length - 1; i++) {
                if (current[keys[i]] === undefined || current[keys[i]] === null) {
                    current[keys[i]] = { ...notSet };
                }
                current = current[keys[i]];
            }
    
            const lastKey = keys[keys.length - 1];
            if (current[lastKey] === undefined || current[lastKey] === null) {
                current[lastKey] = notSet;
            }
            current[lastKey] = updater(current[lastKey]);
        },

        messaged: (state, { payload: { message, timestamp, updateMessage, isMine, username } }) => {
            message.create_date = timestamp;
            message.receive_date = timestamp;
            message.read_date = '1970-01-01T00:00:00';
            if (!message.donates) {
                message.donates = '0.000 GOLOS';
                message.donates_uia = 0;
            }
    
            const { group, mentions } = opGroup(message);
            message.group = group;
            message.mentions = mentions;
            message.read_date = (group && !message.to) ? timestamp : '1970-01-01T00:00:00';
    
            let messages_update = message.nonce;
    
            // Initialize arrays if needed
            if (!state.messages) state.messages = [];
            if (!state.contacts) state.contacts = [];
    
            // Update messages
            if (updateMessage) {
                const idx = state.messages.findIndex(i => i.nonce === message.nonce);
                if (idx === -1) {
                    state.messages.unshift({ ...message });
                } else {
                    state.messages[idx] = { ...message };
                }
            }
    
            state.messages_update = messages_update;
    
            // Update contacts
            let idx = state.contacts.findIndex(i => {
                if (group) {
                    return i.kind === 'group' && i.contact === group;
                }
                return i.kind !== 'group' &&
                    (i.contact === message.to || i.contact === message.from);
            });
    
            let newInbox = 0, newMentions = 0;
            if (!isMine && !updateMessage) {
                if (!group || message.to === username) {
                    newInbox++;
                } else if (group && message.mentions && message.mentions.includes(username)) {
                    newMentions++;
                }
            }
    
            if (idx === -1) {
                let contact = group || (isMine ? message.to : message.from);
                state.contacts.unshift({
                    contact,
                    kind: group ? 'group' : 'account',
                    last_message: { ...message },
                    size: {
                        unread_inbox_messages: newInbox,
                        unread_mentions: newMentions,
                    },
                });
            } else {
                const contact = state.contacts[idx];
                contact.last_message = { ...message };
                if (newInbox) {
                    contact.size.unread_inbox_messages = (contact.size.unread_inbox_messages || 0) + newInbox;
                }
                if (newMentions) {
                    contact.size.unread_mentions = (contact.size.unread_mentions || 0) + newMentions;
                }
            }
    
            // Sort contacts
            state.contacts.sort((a, b) => {
                return b.last_message.receive_date.localeCompare(a.last_message.receive_date);
            });
    
            // Update from_account if present
            if (message.from_account && message.from_account.name) {
                const fromAccount = message.from_account;
                if (!state.accounts[fromAccount.name]) {
                    state.accounts[fromAccount.name] = {};
                }
                state.accounts[fromAccount.name] = merge(state.accounts[fromAccount.name], fromAccount);
            }
        },

        messageEdited: (state, { payload: { message, timestamp, updateMessage, isMine } }) => {
            let messages_update = message.nonce;
    
            if (updateMessage) {
                if (!state.messages) state.messages = [];
                const idx = state.messages.findIndex(i => i.nonce === message.nonce);
                if (idx !== -1) {
                    state.messages[idx].receive_date = timestamp;
                    state.messages[idx].checksum = message.checksum;
                    state.messages[idx].encrypted_message = message.encrypted_message;
                }
            }
    
            state.messages_update = messages_update + 2;
        },

        messageRead: (state, { payload: { message, timestamp, updateMessage, isMine } }) => {
            let messages_update = message.nonce || Math.random();
            const { group, requester } = opGroup(message);
    
            if (updateMessage) {
                if (!state.messages) state.messages = [];
                state.messages = processDatedGroup(message, state.messages, (msg, idx) => {
                    msg.read_date = timestamp;
                    return { updated: msg };
                });
            }
    
            if (!state.contacts) state.contacts = [];
            const idx = state.contacts.findIndex(i =>
                i.contact === (group || (isMine ? message.to : message.from)));
        
            if (idx !== -1) {
                const contact = state.contacts[idx];
        
                // Update read_date for last_message
                if (contact.last_message && contact.last_message.nonce === message.nonce) {
                    contact.last_message.read_date = timestamp;
                }
        
                // Reset unread counters
                const msgsKey = isMine ? 'unread_outbox_messages' : 'unread_inbox_messages';
                if (!contact.size) contact.size = {};
                contact.size[msgsKey] = 0;
                if (!isMine) {
                    contact.size.unread_mentions = 0;
                }
            }
    
            state.messages_update = messages_update + 1;
        },

        messageDeleted: (state, { payload: { message, updateMessage } }) => {
            if (updateMessage) {
                if (!state.messages) state.messages = [];
        
                if (message.nonce) {
                    const idx = state.messages.findIndex(i => i.nonce === message.nonce);
                    if (idx !== -1) {
                        state.messages.splice(idx, 1);
                    }
                } else {
                    state.messages = processDatedGroup(message, state.messages, (msg, idx) => {
                        return { updated: null, fixIdx: idx - 1 };
                    });
                }
            }
    
            const delCon = opDeleteContact(message);
            if (delCon) {
                if (!state.contacts) state.contacts = [];
                const idx = state.contacts.findIndex(i =>
                    i.contact === message.to || i.contact === message.from);
                if (idx !== -1) {
                    state.contacts.splice(idx, 1);
                }
            }
        },

        messageDonated: (state, { payload: { op, updateMessage, isMine } }) => {
            if (updateMessage) {
                const { from, to, nonce } = op.memo.target;
                const amount = Asset(op.amount);
        
                if (!state.messages) state.messages = [];
                const idx = state.messages.findIndex(i => i.nonce === nonce);
                if (idx !== -1) {
                    const obj = state.messages[idx];
                    if (!amount.isUIA) {
                        const donates = Asset(obj.donates).plus(amount);
                        obj.donates = donates.toString();
                    } else {
                        let donates_uia = parseInt(obj.donates_uia);
                        donates_uia += parseInt(amount.amountFloat.split('.')[0]);
                        obj.donates_uia = donates_uia;
                    }
                }
                state.messages_update = Math.random();
            } else if (!isMine) {
                const { from, to, nonce } = op.memo.target;
                if (!state.contacts) state.contacts = [];
                const idx = state.contacts.findIndex(i =>
                    i.contact === to || i.contact === from);
                if (idx !== -1) {
                    state.contacts[idx].unread_donate = true;
                }
                state.messages_update = Math.random();
            }
        },

        fetchUiaBalances: (state) => {
        },

        receiveUiaBalances: (state, { payload: { assets } }) => {
            state.assets = assets;
        },

        fetchMyGroups: (state) => {
        },

        receiveMyGroups: (state, { payload: { groups, stat } }) => {
            state.my_groups = groups;
            state.my_groups_stat = stat;
        },

        fetchTopGroups: (state) => {
        },

        receiveTopGroups: (state, { payload: { groups } }) => {
            state.top_groups = groups;
        },

        fetchGroupMembers: (state) => {
        },

        receiveGroupMembers: (state, { payload: { group, members, loading, append } }) => {
            // Initialize groups if needed
            if (!state.groups) state.groups = {};
            if (!state.groups[group]) state.groups[group] = {};
            const gro = state.groups[group];
    
            // Initialize members structure
            if (!gro.members) gro.members = {};
            const mems = gro.members;
            mems.loading = loading || false;
    
            if (append) {
                if (!mems.data) mems.data = [];
                if (members) {
                    mems.data.push(...members);
                }
            } else {
                mems.data = members || [];
            }
    
            // Update accounts from member data
            if (members) {
                for (const mem of members) {
                    if (mem.account_data) {
                        const account = mem.account_data;
                        if (!state.accounts[account.name]) {
                            state.accounts[account.name] = {};
                        }
                        state.accounts[account.name] = merge(state.accounts[account.name], account);
                    }
                }
            }
        },

        upsertGroup: (state, { payload }) => {
            const { creator, name, is_encrypted, privacy, json_metadata } = payload;
    
            const groupUpdater = (gro) => {
                gro.json_metadata = json_metadata;
                gro.privacy = privacy;
                return gro;
            };
    
            const groupsUpserter = (myGroups) => {
                const now = new Date().toISOString().split('.')[0];
                myGroups.unshift({
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
                    member_list: [],
                    my_role: 'own',
                });
            };
    
            updateInMyGroups(state, name, groupUpdater, groupsUpserter);
            updateTheGroup(state, name, groupUpdater);
        },

        updateGroupMember: (state, { payload: { group, member, member_type } }) => {
            const now = new Date().toISOString().split('.')[0];
            let oldType;
    
            // Update group members data
            if (!state.groups) state.groups = {};
            if (!state.groups[group]) state.groups[group] = {};
            const gro = state.groups[group];
    
            if (!gro.members) gro.members = {};
            if (!gro.members.data) gro.members.data = [];
    
            const mems = gro.members.data;
            const retiring = member_type === 'retired';
            const idx = mems.findIndex(i => i.account === member);
    
            if (idx !== -1) {
                oldType = mems[idx].member_type;
                if (retiring) {
                    mems.splice(idx, 1);
                } else {
                    mems[idx].member_type = member_type;
                }
            } else if (!retiring) {
                mems.unshift({
                    group,
                    account: member,
                    json_metadata: '{}',
                    member_type,
                    invited: member,
                    joined: now,
                    updated: now,
                });
            }
    
            // Update my_groups and the_group
            const groupUpdater = (gro) => {
                if (!gro.member_list) gro.member_list = [];
        
                let found = false;
                const newList = [];
        
                gro.member_list.forEach(mem => {
                    if (mem.account === member) {
                        found = true;
                        if (!oldType) oldType = mem.member_type;
                        if (member_type !== 'retired') {
                            newList.push({ ...mem, member_type });
                        }
                    } else {
                        newList.push(mem);
                    }
                });
        
                if (!found) {
                    newList.push({
                        account: member,
                        member_type,
                    });
                }
        
                gro.member_list = newList;
        
                const updateByType = (t, updater) => {
                    if (t === 'member') {
                        gro.members = updater(gro.members || 0);
                    } else if (t === 'moder') {
                        gro.moders = updater(gro.moders || 0);
                    } else if (t === 'pending') {
                        gro.pendings = updater(gro.pendings || 0);
                    } else if (t === 'banned') {
                        gro.banneds = updater(gro.banneds || 0);
                    }
                };
        
                updateByType(oldType, n => n - 1);
                updateByType(member_type, n => n + 1);
        
                return gro;
            };
    
            updateInMyGroups(state, group, groupUpdater);
            updateTheGroup(state, group, groupUpdater);
    
            // Update account member type
            if (!state.accounts[member]) state.accounts[member] = {};
            state.accounts[member].member_type = member_type;
        },

        updateBlocking: (state, { payload: { blocker, blocking, block } }) => {
            let username;
            const sess = session.load();
            if (sess) username = sess[0];
            const account = blocker === username ? blocking : blocker;
    
            if (!state.accounts[account]) state.accounts[account] = {};
            const acc = state.accounts[account];
    
            if (!acc.relations) acc.relations = {};
    
            const path = blocker === username ? 'me_to_them' : 'they_to_me';
    
            if (block) {
                acc.relations[path] = 'blocking';
            } else {
                delete acc.relations[path];
            }
        },
    },
});

export const {
    receiveAccount,
    receiveState,
    update: updateSome,
    messaged,
    messageEdited,
    messageRead,
    messageDeleted,
    messageDonated,
    fetchUiaBalances,
    receiveUiaBalances,
    fetchMyGroups,
    receiveMyGroups,
    fetchTopGroups,
    receiveTopGroups,
    fetchGroupMembers,
    receiveGroupMembers,
    upsertGroup,
    updateGroupMember,
    updateBlocking,
} = globalSlice.actions;

export default globalSlice.reducer;
