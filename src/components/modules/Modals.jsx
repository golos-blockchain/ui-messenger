import React from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';
import LoginForm from 'app/components/modules/LoginForm';
import user from 'app/redux/UserReducer'
//import tr from 'app/redux/Transaction';
import {NotificationStack} from 'react-notification';

let keyIndex = 0;

class Modals extends React.Component {
    static propTypes = {
        show_login_modal: PropTypes.bool,
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
            hideLogin,
            notifications,
            removeNotification,
        } = this.props;

        const notifications_array = notifications ? notifications.toArray().map(n => {
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
            loginUnclosable,
            notifications: state.app.get('notifications'),
        }
    },
    dispatch => ({
        hideLogin: e => {
            if (e) e.preventDefault();
            dispatch(user.actions.hideLogin())
        },
        /*
        // example: addNotification: ({key, message}) => dispatch({type: 'ADD_NOTIFICATION', payload: {key, message}}),
        removeNotification: (key) => dispatch({type: 'REMOVE_NOTIFICATION', payload: {key}}),
        */
    })
)(Modals)