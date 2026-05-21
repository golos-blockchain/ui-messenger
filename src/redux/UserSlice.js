import merge from 'lodash/merge';
import { createSlice } from '@reduxjs/toolkit';

const defaultState = {
    current: null,
    show_login_modal: false,
    show_donate_modal: false,
    show_create_group_modal: false,
    show_my_groups_modal: false,
    show_top_groups_modal: false,
    show_group_settings_modal: false,
    show_group_members_modal: false,
    show_app_download_modal: false,
    loginLoading: false,
    pub_keys_used: null,
    locale: localStorage.getItem('locale') || 'ru-RU',
    nightmodeEnabled: localStorage.getItem('nightmodeEnabled') === 'true',
};

const userSlice = createSlice({
    name: 'user',
    initialState: defaultState,
    reducers: {
        showLogin: (state, { payload }) => {
            // https://github.com/mboperator/redux-modules/issues/11
            if (typeof payload === 'function') payload = undefined;
            let operation, loginDefault;
            if (payload) {
                operation = payload.operation;
                loginDefault = payload.loginDefault;
            }
            state.show_login_modal = true;
            state.loginBroadcastOperation = operation;
            state.loginDefault = loginDefault;
        },
        hideLogin: (state) => {
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
        },
        saveLoginConfirm: (state, { payload }) => {
            state.saveLoginConfirm = payload;
        },
        saveLogin: (state) => state, // Use only for low security keys (like posting only keys)
        getAccount: (state) => state,
        removeHighSecurityKeys: (state) => {
            if (!state.current || !state.current.private_keys) return state;
            let empty = false;
            const private_keys = { ...state.current.private_keys };
            if (private_keys.active_private) {
                console.log('removeHighSecurityKeys');
                delete private_keys.active_private;
            }
            empty = Object.keys(private_keys).length === 0;
            if (empty) {
                // User logged in with Active key then navigates away from the page
                // LOGOUT
                return { ...defaultState, logged_out: true };
            }
            state.current.private_keys = private_keys;
            const username = state.current.username;
            if (!state.authority) state.authority = {};
            state.authority[username] = state.authority[username] || {};
            state.authority[username].active = 'none';
            state.authority[username].owner = 'none';
        },
        changeLanguage: (state, { payload }) => {
            state.locale = payload;
        },
        toggleNightmode: (state) => {
            const nightmodeEnabled = localStorage.getItem('nightmodeEnabled') === 'true' || false;
            localStorage.setItem('nightmodeEnabled', !nightmodeEnabled);
            state.nightmodeEnabled = !nightmodeEnabled;
        },
        usernamePasswordLogin: (state) => {
            state.loginLoading = true;
        },
        setUser: (state, { payload }) => {
            const newState = merge({}, state, {
                current: payload,
                show_login_modal: false,
                loginBroadcastOperation: undefined,
                loginDefault: undefined,
                logged_out: undefined,
                loginLoading: false,
            });
            return newState;
        },
        closeLogin: (state) => {
            state.loginError = undefined;
            state.show_login_modal = false;
            state.loginBroadcastOperation = undefined;
            state.loginDefault = undefined;
        },
        loginError: (state, { payload: { error, ...rest } }) => {
            state.loginError = { error, ...rest };
            state.logged_out = undefined;
            state.loginLoading = error ? false : state.loginLoading;
        },
        stopLoading: (state) => {
            state.loginLoading = false;
        },
        logout: () => {
            return { ...defaultState, logged_out: true };
        },
        keysError: (state, { payload: { error } }) => {
            state.keys_error = error;
        },
        // { action: 'UPDATE_PERMISSIONS', reducer: state => {
        //     return state // saga
        // }},
        accountAuthLookup: (state) => state,
        setAuthority: (state, { payload: { accountName, auth, pub_keys_used } }) => {
            if (!state.authority) state.authority = {};
            state.authority[accountName] = auth;
            if (pub_keys_used) state.pub_keys_used = pub_keys_used;
        },
        hideConnectionErrorModal: (state) => {
            state.hide_connection_error_modal = true;
        },
        uploadImage: (state) => state, // UserSaga_UploadImage
        showDonate: (state) => {
            state.show_donate_modal = true;
        },
        hideDonate: (state) => {
            state.show_donate_modal = false;
        },
        showCreateGroup: (state, { payload: { redirectAfter } }) => {
            state.show_create_group_modal = true;
            state.create_group_redirect_after = redirectAfter;
        },
        hideCreateGroup: (state) => {
            state.show_create_group_modal = false;
        },
        showMyGroups: (state) => {
            state.show_my_groups_modal = true;
        },
        hideMyGroups: (state) => {
            state.show_my_groups_modal = false;
        },
        showTopGroups: (state) => {
            state.show_top_groups_modal = true;
        },
        hideTopGroups: (state) => {
            state.show_top_groups_modal = false;
        },
        showGroupSettings: (state, { payload: { group } }) => {
            state.show_group_settings_modal = true;
            state.current_group = group;
        },
        hideGroupSettings: (state) => {
            state.show_group_settings_modal = false;
        },
        showGroupMembers: (state, { payload: { group, current_tab } }) => {
            state.show_group_members_modal = true;
            state.group_members_modal = { group, current_tab };
        },
        hideGroupMembers: (state) => {
            state.show_group_members_modal = false;
        },
        showAppDownload: (state) => {
            state.show_app_download_modal = true;
        },
        hideAppDownload: (state) => {
            state.show_app_download_modal = false;
        },
        setDonateDefaults: (state, { payload }) => {
            state.donate_defaults = payload;
        },
        set: (state, { payload: { key, value } }) => {
            // nested keys are like ['user', 'name']
            const keys = Array.isArray(key) ? key : [key];
            let target = state;
            for (let i = 0; i < keys.length - 1; i++) {
                if (!target[keys[i]]) target[keys[i]] = {};
                target = target[keys[i]];
            }
            target[keys[keys.length - 1]] = value;
        },
    },
});

export const { 
    showLogin, hideLogin, saveLoginConfirm, saveLogin, getAccount,
    removeHighSecurityKeys, changeLanguage, toggleNightmode,
    usernamePasswordLogin, setUser, closeLogin, loginError, stopLoading,
    logout, keysError, accountAuthLookup, setAuthority,
    hideConnectionErrorModal, uploadImage, showDonate, hideDonate, showCreateGroup,
    hideCreateGroup, showMyGroups, hideMyGroups, showTopGroups, hideTopGroups,
    showGroupSettings, hideGroupSettings, showGroupMembers, hideGroupMembers,
    showAppDownload, hideAppDownload, setDonateDefaults,
    set: setSome,
} = userSlice.actions;

export default userSlice.reducer;
