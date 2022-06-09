import { Map, fromJS } from 'immutable'
import createModule from 'redux-modules'

const defaultState = fromJS({
    current: null,
    show_login_modal: false,
    show_donate_modal: false,
    loginLoading: false,
    pub_keys_used: null,
    locale: localStorage.getItem('locale') || 'ru-RU',
    nightmodeEnabled: localStorage.getItem('nightmodeEnabled') === 'true',
});

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
        { action: 'CHANGE_LANGUAGE', reducer: (state, {payload}) => {
            return state.set('locale', payload)}
        },
        { action: 'TOGGLE_NIGHTMODE', reducer: (state) => {
            const nightmodeEnabled = localStorage.getItem('nightmodeEnabled') == 'true' || false

            localStorage.setItem('nightmodeEnabled', !nightmodeEnabled)
            return state.set('nightmodeEnabled', !nightmodeEnabled)
          }
        },
        {
            action: 'USERNAME_PASSWORD_LOGIN',
            reducer: state => state.mergeDeep({ loginLoading: true })
        },
        {
            action: 'SET_USER',
            reducer: (state, {payload}) => {
                // TODO: but how it works in blogs?
                if(!(payload instanceof Map)) {
                    payload = fromJS(payload);
                }
                return state.mergeDeep({ current: payload,
                    show_login_modal: false, loginBroadcastOperation: undefined,
                    loginDefault: undefined, logged_out: undefined,
                    loginLoading: false })
            }
        },
        {
            action: 'CLOSE_LOGIN',
            reducer: (state) => state.merge({ loginError: undefined, show_login_modal: false, loginBroadcastOperation: undefined, loginDefault: undefined })
        },
        {
            action: 'LOGIN_ERROR',
            reducer: (state, {payload: {error, ...rest}}) => state.merge({
                loginError: { error, ...rest },
                logged_out: undefined,
                loginLoading: error ? false : state.get('loginLoading')
            })
        },
        {
            action: 'STOP_LOADING',
            reducer: (state) => state.merge({ loginLoading: false })
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
        { action: 'SHOW_DONATE', reducer: state => state.set('show_donate_modal', true) },
        { action: 'HIDE_DONATE', reducer: state => state.set('show_donate_modal', false) },
        { action: 'SET_DONATE_DEFAULTS', reducer: (state, {payload}) => state.set('donate_defaults', fromJS(payload)) },
        {
            action: 'SET',
            reducer: (state, {payload: {key, value}}) => {
                key = Array.isArray(key) ? key : [key]
                return state.setIn(key, fromJS(value))
            }
        },
    ]
});
