import React from 'react';
import PropTypes from 'prop-types'
import {NotificationStack} from 'react-notification'
import { connect } from 'react-redux';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';

import Donate from 'app/components/modules/Donate'
import LoginForm from 'app/components/modules/LoginForm';
import AppDownload from 'app/components/modules/app/AppDownload'
import user from 'app/redux/UserReducer'
//import tr from 'app/redux/Transaction';

let keyIndex = 0;

class Modals extends React.Component {
    static propTypes = {
        show_login_modal: PropTypes.bool,
        show_donate_modal: PropTypes.bool,
        show_app_download_modal: PropTypes.bool,
        hideDonate: PropTypes.func.isRequired,
        hideAppDownload: PropTypes.func.isRequired,
        notifications: PropTypes.object,
        removeNotification: PropTypes.func,
    };

    onLoginBackdropClick = (e) => {
        const { loginUnclosable } = this.props;
        if (loginUnclosable)
            throw new Error('Closing login modal is forbidden here');
    };

    render() {
        const {
            show_login_modal,
            show_donate_modal,
            show_app_download_modal,
            hideLogin,
            hideDonate,
            hideAppDownload,
            notifications,
            removeNotification,
        } = this.props;

        const notifications_array = notifications ? notifications.toArray().map(kv => {
            const n = kv[1]
            if (!n.key) {
                n.key = ++keyIndex;
            }
            n.onClick = () => removeNotification(n.key);
            return n;
        }) : [];

        return (
            <div>
                {show_login_modal && <Reveal onBackdropClick={this.onLoginBackdropClick} onHide={hideLogin} show={show_login_modal}>
                    <LoginForm onCancel={hideLogin} />
                </Reveal>}
                {show_donate_modal && <Reveal revealStyle={{ overflow: 'hidden' }} onHide={hideDonate} show={show_donate_modal}>
                    <CloseButton onClick={hideDonate} />
                    <Donate />
                </Reveal>}
                {show_app_download_modal && <Reveal onHide={hideAppDownload} show={show_app_download_modal}>
                    <CloseButton onClick={hideAppDownload} />
                    <AppDownload />
                </Reveal>}
                <NotificationStack
                    style={false}
                    notifications={notifications_array}
                    onDismiss={n => removeNotification(n.key)}
                />
            </div>
        );
    }
}

export default connect(
    state => {
        const loginDefault = state.user.get('loginDefault');
        const loginUnclosable = loginDefault && loginDefault.get('unclosable');
        return {
            show_login_modal: state.user.get('show_login_modal'),
            show_donate_modal: state.user.get('show_donate_modal'),
            show_app_download_modal: state.user.get('show_app_download_modal'),
            loginUnclosable,
            notifications: state.app.get('notifications'),
        }
    },
    dispatch => ({
        hideLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideLogin())
        },
        hideDonate: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideDonate())
        },
        hideAppDownload: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideAppDownload())
        },
        
        // example: addNotification: ({key, message}) => dispatch({type: 'ADD_NOTIFICATION', payload: {key, message}}),
        removeNotification: (key) => dispatch({type: 'REMOVE_NOTIFICATION', payload: {key}}),

    })
)(Modals)
