import React from 'react';
import PropTypes from 'prop-types';
import tt from 'counterpart';
import { config, auth } from 'golos-lib-js'

import DialogFrame from 'app/components/dialogs/DialogFrame';
import DialogManager from 'app/components/elements/common/DialogManager';
import Input from 'app/components/elements/common/Input';
import keyCodes from 'app/utils/keyCodes';
import { pageSession } from 'app/redux/UserSaga'

export function showLoginDialog(username, onClose, authType = 'active', saveLogin = false, hint = '') {
    DialogManager.showDialog({
        component: LoginDialog,
        adaptive: true,
        props: {
            username,
            authType,
            hint,
        },
        onClose: (data) => {
            if (onClose) onClose(data)
        },
    });
}

export default class LoginDialog extends React.PureComponent {
    static propTypes = {
        onClose: PropTypes.func.isRequired,
    };

    state = {
        password: '',
        error: '',
        saveLogin: false
    }

    componentDidMount() {
        let { saveLogin, hint } = this.props
        const session = pageSession.load()
        if (session) {
            this.setState({
                password: session[1]
            })
            saveLogin = true
        }
        if (saveLogin) {
            this.setState({ saveLogin })
        }
        const linkInput = document.getElementsByClassName('AddImageDialog__link-input')[0];
        if (linkInput)
            linkInput.focus();
        setTimeout(() => {
            this.setState({
                enabled: true
            })
        }, hint ? 1500 : 0)
    }

    onPasswordChange = (e) => {
        e.preventDefault()
        this.setState({
            password: e.target.value
        })
    }

    onSaveLoginChange = (e) => {
        this.setState({
            saveLogin: !this.state.saveLogin
        })
    }

    onLogin = async (e) => {
        e.preventDefault()
        const { username, authType } = this.props
        const { password, saveLogin } = this.state

        this.setState({
            error: ''
        })
        let authRes
        try {
            authRes = await auth.login(username, password)
        } catch (err) {
            this.setState({
                error: tt('login_dialog_jsx.node_failure_NODE_ERROR', {
                    NODE: config.get('websocket'),
                    ERROR: err.toString().substring(0, 100)
                })
            })
            return
        }
        if (!authRes[authType]) {
            this.setState({
                error: tt('login_dialog_jsx.wrong_pass_ROLE', {
                    ROLE: authType
                })
            })
            return
        }

        if (saveLogin) {
            pageSession.save(password, username)
        } else {
            pageSession.clear()
        }

        this.setState({
            error: ''
        })
        this.props.onClose({
            password
        })
    }

    onCancel = (e) => {
        e.preventDefault()
        this.props.onClose({})
    }

    render() {
        const { password, error, saveLogin, enabled } = this.state

        let hint
        if (this.props.hint) {
            hint = <b style={{ color: 'red' }}>&nbsp;{this.props.hint}</b>
        }

        return (
            <DialogFrame
                className='LoginDialog'
                title={tt('loginform_jsx.login_active')}
                onCloseClick={this._onCloseClick}
            >
                <div>
                    <div className="AddImageDialog__link-text">
                        {tt('loginform_jsx.is_is_for_operation')}
                        {hint}
                        .
                    </div>
                    <Input
                        block
                        className="AddImageDialog__link-input"
                        type='password'
                        autoFocus
                        required
                        autoComplete='on'
                        value={password}
                        onKeyDown={this._onInputKeyDown}
                        onChange={this.onPasswordChange}
                    />
                </div>
                {error && <div className='error'>
                    {error}
                </div>}
                <div style={{ marginTop: '1rem' }}>
                    <center>
                    <label htmlFor='saveLogin'>
                        {tt('loginform_jsx.keep_me_logged_in_memo')} &nbsp;
                        <input id='saveLogin' type='checkbox' checked={saveLogin}
                            onClick={this.onSaveLoginChange} />
                    </label>
                    </center>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <center>
                    <button disabled={!enabled} className='button' onClick={this.onLogin}>
                        {enabled ? tt('g.login') : tt('g.wait')}
                    </button>
                    <button className='button hollow' onClick={this.onCancel}>
                        {tt('g.cancel')}
                    </button>
                    </center>
                </div>
            </DialogFrame>
        );
    }

    _onInputKeyDown = e => {
        if (e.which === keyCodes.ENTER) {
            e.preventDefault();
            this.props.onClose({
                url: e.target.value,
            });
        }
    };

    _onCloseClick = () => {
        this.props.onClose();
    };
}
