import {Map, OrderedMap} from 'immutable';
import tt from 'counterpart';

const defaultState = Map({
    notifications: null,
    notificounters: Map({
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
        donate: 0
    })
});

export default function reducer(state = defaultState, action) {
    let res = state;
    if (action.type === 'ADD_NOTIFICATION') {
        const n = {
            action: tt('g.dismiss'),
            dismissAfter: 10000,
            ...action.payload
        };
        res = res.update('notifications', s => {
            return s ? s.set(n.key, n) : OrderedMap({[n.key]: n});
        });
    }
    if (action.type === 'REMOVE_NOTIFICATION') {
        res = res.update('notifications', s => s.delete(action.payload.key));
    }
    if (action.type === 'UPDATE_NOTIFICOUNTERS' && action.payload) {
        const nc = action.payload;
        if (nc.follow > 0) {
            nc.total -= nc.follow;
            nc.follow = 0;
        }
        res = res.set('notificounters', Map(nc));
    }
    return res;
}
