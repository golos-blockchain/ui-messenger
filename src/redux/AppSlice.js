import { createSlice } from '@reduxjs/toolkit';
import tt from 'counterpart';

const initialState = {
    notifications: null,
    notificounters: {
        total: 0,
        feed: 0,
        reward: 0,
        send: 0,
        mention: 0,
        follow: 0,
        vote: 0,
        reply: 0,
        account_update: 0,
        message: 0,
        receive: 0,
        donate: 0,
    },
};

const appSlice = createSlice({
    name: 'app',
    initialState,
    reducers: {
        addNotification(state, action) {
            const n = {
                action: tt('g.dismiss'),
                dismissAfter: 10000,
                ...action.payload,
            };
            if (state.notifications) {
                state.notifications[n.key] = n;
            } else {
                state.notifications = { [n.key]: n };
            }
        },
        removeNotification(state, action) {
            if (state.notifications) {
                delete state.notifications[action.payload.key];
            }
        },
        updateNotificounters(state, action) {
            if (action.payload) {
                const nc = { ...action.payload };
                if (nc.follow > 0) {
                    nc.total -= nc.follow;
                    nc.follow = 0;
                }
                state.notificounters = nc;
            }
        },
    },
});

export const { addNotification, removeNotification, updateNotificounters } =
    appSlice.actions;

export default appSlice.reducer;
