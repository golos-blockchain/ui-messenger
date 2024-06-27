import { fork, call, put, select } from 'redux-saga/effects'

import { getNotifications } from 'app/utils/NotifyApiClient'

const wait = ms => (
    new Promise(resolve => {
        setTimeout(() => resolve(), ms)
    })
)

let webpush_params = null;

export default function* pollData() {
    if (process.env.NO_NOTIFY) { // config-overrides.js, yarn run dev
        console.warn('Notifications disabled in environment variables')
        return
    }
    while(true) {
        if (document.visibilityState !== 'hidden') {
            const username = yield select(state => state.user.getIn(['current', 'username']));
            if (username) {
                let counters = null;
                try {
                    counters = yield call(getNotifications, username, webpush_params);
                } catch (error) {
                    console.error('getNotifications', error);
                }
                if (counters)
                    yield put({type: 'UPDATE_NOTIFICOUNTERS', payload: counters});
                yield call(wait, 5000);
            } else {
                yield call(wait, 1000);
            }
        } else {
            yield call(wait, 500);
        }
    }
}
