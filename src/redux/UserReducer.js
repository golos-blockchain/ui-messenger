import { Map, fromJS } from 'immutable'
import createModule from 'redux-modules'

const defaultState = fromJS({
    current: null,
    show_login_modal: false,
    pub_keys_used: null,
    nightmodeEnabled: false,
});

if (process.env.BROWSER) {
    defaultState.nightmodeEnabled = localStorage.getItem('nightmodeEnabled') == 'true' || false
}

export default createModule({
    name: 'user',
    initialState: defaultState,
    transformations: [
        {
            action: 'SHOW_LOGIN',
            reducer: (state, {payload}) => {
                // https://github.com/mboperator/redux-modules/issues/11
                if (typeof payload === 'function') payload = undefined
                let operation, loginDefault
                if (payload) {
                    operation = fromJS(payload.operation)
                    loginDefault = fromJS(payload.loginDefault)
                }
                return state.merge({show_login_modal: true, loginBroadcastOperation: operation, loginDefault})
            }
        },

        { action: 'HIDE_LOGIN', reducer: state =>
            state.merge({show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined}) },
        { action: 'SAVE_LOGIN_CONFIRM', reducer: (state, {payload}) => state.set('saveLoginConfirm', payload) },
        { action: 'SAVE_LOGIN', reducer: (state) => state }, // Use only for low security keys (like posting only keys)
        { action: 'GET_ACCOUNT', reducer: (state) => state },
        { action: 'REMOVE_HIGH_SECURITY_KEYS', reducer: (state) => {
            if(!state.hasIn(['current', 'private_keys'])) return state
            let empty = false
            state = state.updateIn(['current', 'private_keys'], private_keys => {
                if(!private_keys) return null
                if(private_keys.has('active_private'))
                    console.log('removeHighSecurityKeys')
                private_keys = private_keys.delete('active_private')
                empty = private_keys.size === 0
                return private_keys
            })
            if(empty) {
                // User logged in with Active key then navigates away from the page
                // LOGOUT
                return defaultState.merge({logged_out: true})
            }
            const username = state.getIn(['current', 'username'])
            state = state.setIn(['authority', username, 'active'], 'none')
            state = state.setIn(['authority', username, 'owner'], 'none')
            return state
        }},
        { action: 'TOGGLE_NIGHTMODE', reducer: (state) => {
            const nightmodeEnabled = localStorage.getItem('nightmodeEnabled') == 'true' || false

            localStorage.setItem('nightmodeEnabled', !nightmodeEnabled)
            return state.set('nightmodeEnabled', !nightmodeEnabled)
          }
        },
        {
            action: 'USERNAME_PASSWORD_LOGIN',
            reducer: state => state, // saga
        },
        {
            action: 'SET_USER',
            reducer: (state, {payload}) => {
                // TODO: but how it works in blogs?
                if(!(payload instanceof Map)) {
                    payload = fromJS(payload);
                }
                return state.mergeDeep({ current: payload, show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined, logged_out: undefined })
            }
        },
        {
            action: 'CLOSE_LOGIN',
            reducer: (state) => state.merge({ login_error: undefined, show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined })
        },
        {
            action: 'LOGIN_ERROR',
            reducer: (state, {payload: {error}}) => state.merge({ login_error: error, logged_out: undefined })
        },
        {
            action: 'LOGOUT',
            reducer: () => {
                return defaultState.merge({logged_out: true})
            }
        },
        {
            action: 'KEYS_ERROR',
            reducer: (state, {payload: {error}}) => state.merge({ keys_error: error })
        },
        // { action: 'UPDATE_PERMISSIONS', reducer: state => {
        //     return state // saga
        // }},
        { // AuthSaga
            action: 'ACCOUNT_AUTH_LOOKUP',
            reducer: state => state
        },
        { // AuthSaga
            action: 'SET_AUTHORITY',
            reducer: (state, {payload: {accountName, auth, pub_keys_used}}) => {
                state = state.setIn(['authority', accountName], fromJS(auth))
                if(pub_keys_used)
                    state = state.set('pub_keys_used', pub_keys_used)
                return state
            },
        },
        { action: 'HIDE_CONNECTION_ERROR_MODAL', reducer: state => state.set('hide_connection_error_modal', true) },
        {
            action: 'SET',
            reducer: (state, {payload: {key, value}}) => {
                key = Array.isArray(key) ? key : [key]
                return state.setIn(key, fromJS(value))
            }
        },
    ]
});
