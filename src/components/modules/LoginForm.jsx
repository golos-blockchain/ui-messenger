/* eslint react/prop-types: 0 */
import React, { Component } from 'react';
import PropTypes from 'prop-types'
import {pageSession} from 'golos-lib-js/lib/auth';
import {PrivateKey, PublicKey} from 'golos-lib-js/lib/auth/ecc'
import tt from 'counterpart';

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import Logo from 'app/components/elements/Logo'
//import transaction from 'app/redux/Transaction'
//import g from 'app/redux/GlobalReducer'
import LoginAppReminder from 'app/components/elements/app/LoginAppReminder'
import user from 'app/redux/UserReducer'
import {validate_account_name} from 'app/utils/ChainValidation';
import runTests from 'app/utils/BrowserTests';
import reactForm from 'app/utils/ReactForm'
import { translateError } from 'app/utils/translateError';
import { authRegisterUrl, } from 'app/utils/AuthApiClient';
import { openAppSettings } from 'app/components/pages/app/AppSettings'

const APP_DOMAIN= 'chat.golos.app'

class LoginForm extends Component {

    static propTypes = {
        loginError: PropTypes.object,
        onCancel: PropTypes.func,
    };

    static defaultProps = {
        afterLoginRedirectToWelcome: false
    }

    constructor(props) {
        super()
        const cryptoTestResult = runTests();
        // const cryptoTestResult = undefined; // temporary switch BrowserTests off
        let cryptographyFailure = false;
        if (cryptoTestResult !== undefined) {
            console.error('LoginForm - cryptoTestResult: ', cryptoTestResult);
            cryptographyFailure = true
        }
        this.state = {cryptographyFailure};
        this.usernameOnChange = e => {
            const value = e.target.value.toLowerCase();
            this.state.username.props.onChange(value)
        };
        this.onCancel = (e) => {
            if(e.preventDefault) e.preventDefault()
            const {onCancel, loginBroadcastOperation} = this.props;
            const errorCallback = loginBroadcastOperation && loginBroadcastOperation.get('errorCallback');
            if (errorCallback) errorCallback('Canceled');
            if (onCancel) onCancel()
        };
        this.qrReader = () => {
            const {qrReader} = props
            const {password} = this.state
            qrReader(data => {password.props.onChange(data)})
        };
        this.initForm(props)
    }

    componentDidMount() {
        if (this.refs.username && !this.refs.username.value) this.refs.username.focus();
        if (this.refs.username && this.refs.username.value) this.refs.pw.focus();
       /*document.body.onclick = async () => { alert('...'); setTimeout(() => { cordova.plugins.notification.local.schedule({
    title: 'My first notification',
    text: 'Thats pretty easy...',
    foreground: true
        }); }, 5000) }*/
    }

    componentDidUpdate(prevProps) {
        if (this.props.initialValues.username !== prevProps.initialValues.username) {
            this.state.username.props.onChange(this.props.initialValues.username)
        }
    }

    initForm(props) {
        reactForm({
            name: 'login',
            instance: this,
            fields: ['username', 'password', 'saveLogin:checked'],
            initialValues: props.initialValues,
            validation: values => ({
                username: ! values.username ? tt('g.required') : validate_account_name(values.username.split('/')[0]),
                password: ! values.password ? tt('g.required') :
                    PublicKey.fromString(values.password) ? tt('loginform_jsx.you_need_a_private_password_or_key') :
                    null,
            })
        })
    }

    saveLoginToggle = () => {
        const {saveLogin} = this.state;
        saveLoginDefault = !saveLoginDefault;
        localStorage.setItem('saveLogin', saveLoginDefault ? 'yes' : 'no');
        saveLogin.props.onChange(saveLoginDefault); // change UI
    };

    showChangePassword = () => {
        const {username, password} = this.state;
        this.props.showChangePassword(username.value, password.value)
    };

    checkRegisterEnabled = (e) => {
        if (e.currentTarget.hasAttribute('disabled'))
            e.preventDefault();
    };

    render() {
        if (this.state.cryptographyFailure) {
            return <div className="row">
                <div className="column">
                    <div className="callout alert">
                        <h4>{tt('loginform_jsx.cryptography_test_failed')}</h4>
                        <p>{tt('loginform_jsx.unable_to_log_you_in')}</p>
                        <p>{tt('loginform_jsx.the_latest_versions_of')} <a href="https://www.google.com/chrome/">Chrome</a> {tt('g.and')} <a href="https://www.mozilla.org/en-US/firefox/new/">Firefox</a> {tt('loginform_jsx.are_well_tested_and_known_to_work_with', {APP_DOMAIN})}</p>
                    </div>
                </div>
            </div>;
        }

        const { loginBroadcastOperation, loginDefault, loginLoading, dispatchSubmit, afterLoginRedirectToWelcome, msg} = this.props;
        const {username, password, saveLogin} = this.state;
        const {submitting, valid, handleSubmit} = this.state.login;
        const {usernameOnChange, onCancel, /*qrReader*/} = this;
        const disabled = submitting || !valid;
        const opType = loginBroadcastOperation ? loginBroadcastOperation.get('type') : null;
        let postType = "";
        const authType = loginDefault && loginDefault.get('authType')
        let isMemo = false;
        if (opType === "vote") {
            postType = tt('loginform_jsx.login_to_vote')
        } else if (opType === "custom_json" && loginBroadcastOperation.getIn(['operation', 'id']) === "follow") {
            postType = 'Login to Follow Users'
        } else if (loginBroadcastOperation) {
            // check for post or comment in operation
            postType = loginBroadcastOperation.getIn(['operation', 'title']) ? tt('loginform_jsx.login_to_post') : tt('loginform_jsx.login_to_comment');
        } else if (authType === 'memo') {
            isMemo = true;
            postType = tt('loginform_jsx.login_to_message');
        }
        const title = postType ? postType : tt('g.login');
        const submitLabel = loginBroadcastOperation ? tt('g.sign_in') : tt('g.login');
        const cancelIsRegister = loginDefault && loginDefault.get('cancelIsRegister');
        const { loginError } = this.props
        let error = !loginLoading && (loginError ? loginError.error : (password.touched && password.error && password.error))
        if (error === 'owner_login_blocked') {
            error = <span>
                {tt('loginform_jsx.this_password_is_bound_to_your_account_owner_key')}
                &nbsp;
                {tt('loginform_jsx.however_you_can_use_it_to')}
                <a onClick={this.showChangePassword}>{tt('loginform_jsx.update_your_password')}</a>
                &nbsp;
                {tt('loginform_jsx.to_obtain_a_more_secure_set_of_keys')}
            </span>
        } else if (error === 'active_login_blocked') {
            error = <span>
              {tt('loginform_jsx.this_password_is_bound_to_your_account_active_key')}
              &nbsp;
              {tt('loginform_jsx.you_may_use_this_active_key_on_other_more')}
            </span>
        } else if (error === 'Node failure') {
            const NODE = loginError && loginError.node
            error = <span>
                {tt('app_settings.node_error_NODE', { NODE } )}
                {tt('app_settings.node_error_NODE3b')}
                <a href='#' onClick={e => {
                    e.preventDefault()
                    openAppSettings()                  
                }}>{tt('g.settings')}</a>.
            </span>
        }
        let message = null;
        if (msg) {
            if (msg === 'accountcreated') {
                message =<div className="callout primary">
                        <p>{tt('loginform_jsx.you_account_has_been_successfully_created')}</p>
                    </div>;
            }
            else if (msg === 'passwordupdated') {
                message = <div className="callout primary">
                    <p>{tt('loginform_jsx.password_update_succes', {accountName: username.value})}</p>
                </div>;
            }
        }
        const password_info = checkPasswordChecksum(password.value) === false ? tt('loginform_jsx.password_info') : null

        const form = (
            <center>
            <form onSubmit={handleSubmit(({data}) => {
                this.state.password.props.onChange('');
                return dispatchSubmit(data, loginBroadcastOperation, afterLoginRedirectToWelcome, authType)
            })}
                onChange={this.props.clearError}
                method="post"
            >
                <div className="input-group">
                    <span className="input-group-label">@</span>
                    <input className="input-group-field" type="text" required placeholder={tt('loginform_jsx.enter_your_username')} ref="username"
                        {...username.props} onChange={usernameOnChange} autoComplete="on" disabled={submitting}
                    />
                </div>
                {username.touched && username.blur && username.error ? <div className="error">{translateError(username.error)}&nbsp;</div> : null}

                <div>
                    <input type="password" required ref="pw" placeholder={isMemo ? tt('loginform_jsx.memo_key') : tt('loginform_jsx.password_or_posting')} {...password.props} autoComplete="on" disabled={submitting} />
                    {error && <div className="error">{translateError(error)}&nbsp;</div>}
                    {error && password_info && <div className="warning">{password_info}&nbsp;</div>}
                </div>
                {loginBroadcastOperation && <div>
                    <div className="info">{tt('loginform_jsx.this_operation_requires_your_key_or_master_password', {authType})}</div>
                </div>}
                {!loginBroadcastOperation && <div>
                    <label htmlFor="saveLogin">
                        {tt(isMemo ? 'loginform_jsx.keep_me_logged_in_memo' : 'loginform_jsx.keep_me_logged_in')} &nbsp;
                        <input id="saveLogin" type="checkbox" ref="pw" {...saveLogin.props} onChange={this.saveLoginToggle} disabled={submitting} /></label>
                </div>}
                {!loginLoading ? <div>
                    <br />
                    <button type="submit" disabled={submitting || disabled} className="button">
                        {submitLabel}
                    </button>
                    {!cancelIsRegister && this.props.onCancel && (!isMemo || !loginDefault.get('unclosable')) && <button type="button float-right" disabled={submitting} className="button hollow" onClick={onCancel}>
                        {tt('g.cancel')}
                    </button>}
                    {cancelIsRegister && !isMemo && <a href={authRegisterUrl()} target='_blank' type="button float-right" disabled={submitting} className="button hollow" onClick={this.checkRegisterEnabled}>
                        {tt('g.sign_up')}
                    </a>}
                </div> : <div>
                    <br />
                    <LoadingIndicator type='circle' size='25px' />
                </div>}
            </form>
        </center>
        );

        let loginForm = (
           <div className="LoginForm">
                <div style={{marginBottom: '3rem'}} className='logo'>
                    <Logo />
                </div>
               {message}
               <center>
                   <h3><span className="OpAction">{title}</span></h3>
               </center>
               <br />
               {form}
               {(!process.env.MOBILE_APP && !process.env.DESKTOP_APP && !isMemo) && <center>
                    <LoginAppReminder />
               </center>}
           </div>
        )

        return loginForm
    }
}

let hasError
let saveLoginDefault = true
if (process.env.BROWSER) {
    const s = localStorage.getItem('saveLogin')
    if (s === 'no') saveLoginDefault = false
}

function urlAccountName() {
    let suggestedAccountName = '';
    const account_match = window.location.hash.match(/account\=([\w\d\-\.]+)/);
    if (account_match && account_match.length > 1) suggestedAccountName = account_match[1];
    return suggestedAccountName
}

function checkPasswordChecksum(password) {
    // A Steemit generated password is a WIF prefixed with a P ..
    // It is possible to login directly with a WIF
    const wif = /^P/.test(password) ? password.substring(1) : password

    if(!/^5[HJK].{45,}/i.test(wif)) {// 51 is the wif length
        // not even close
        return undefined
    }

    return PrivateKey.isWif(wif)
}

import {connect} from 'react-redux'
export default connect(

    // mapStateToProps
    (state) => {
        const loginError = state.user.get('loginError')
        const currentUser = state.user.get('current')
        const loginBroadcastOperation = state.user.get('loginBroadcastOperation')

        const initialValues = {
            saveLogin: saveLoginDefault,
            username: '',
            password: ''
        }

        // The username input has a value prop, so it should not use initialValues
        let initialUsername = currentUser && currentUser.has('username') ? currentUser.get('username') : urlAccountName()
        //fixme - redesign (code duplication with USaga, UProfile)

        const loginDefault = state.user.get('loginDefault')
        if(loginDefault) {
            const {username, authType} = loginDefault.toJS()
            if(username && authType) initialValues.username = username + '/' + authType
        } else if (initialUsername) {
            initialValues.username = initialUsername;
        }
        let msg = '';
        const msg_match = window.location.hash.match(/msg\=([\w]+)/);
        if (msg_match && msg_match.length > 1) msg = msg_match[1];
        hasError = !!loginError
        return {
            loginError: (loginError && loginError.toJS) ? loginError.toJS() : loginError,
            loginLoading: state.user.get('loginLoading'),
            loginBroadcastOperation,
            initialValues,
            initialUsername,
            loginDefault,
            msg,
        }
    },

    // mapDispatchToProps
    dispatch => ({
        dispatchSubmit: (data, loginBroadcastOperation, afterLoginRedirectToWelcome, authType) => {
            const {password, saveLogin} = data
            const username = data.username.trim().toLowerCase()
            if (loginBroadcastOperation) {
                /*const {type, operation, trx, successCallback, errorCallback} = loginBroadcastOperation.toJS()
                const authSaver = () => {
                    if (!/^vote|comment/.test(type) && location.pathname.startsWith('/market')) {
                        pageSession.save(password, username, 'active');
                    }
                    successCallback();
                };
                dispatch(transaction.actions.broadcastOperation({type, operation, trx, username, password, successCallback: authSaver, errorCallback}))
                // Avoid saveLogin, this could be a user-provided content page and the login might be an active key.  Security will reject that...
                dispatch(user.actions.usernamePasswordLogin({username, password, saveLogin: true, afterLoginRedirectToWelcome, operationType: type}))
                dispatch(user.actions.closeLogin())*/
            } else {
                dispatch(user.actions.usernamePasswordLogin({username, password, saveLogin, afterLoginRedirectToWelcome, authType}))
            }
        },
        /*clearError: () => { if (hasError) dispatch(user.actions.loginError({error: null})) },
        qrReader: (dataCallback) => {
            dispatch(g.actions.showDialog({name: 'qr_reader', params: {handleScan: dataCallback}}));
        },
        showChangePassword: (username, defaultPassword) => {
            dispatch(user.actions.closeLogin())
            dispatch(g.actions.remove({key: 'changePassword'}))
            dispatch(g.actions.showDialog({name: 'changePassword', params: {username, defaultPassword}}))
        },*/
    })
)(LoginForm)
