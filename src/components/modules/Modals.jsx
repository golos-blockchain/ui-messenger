import React from 'react';
import PropTypes from 'prop-types'
import {NotificationStack} from 'react-notification'
import { connect } from 'react-redux';
import { withRouter } from 'react-router'
import CloseButton from 'react-foundation-components/lib/global/close-button';
import Reveal from 'react-foundation-components/lib/global/reveal';

import CreateGroup from 'app/components/modules/CreateGroup'
import GroupSettings from 'app/components/modules/groups/GroupSettings'
import GroupMembers from 'app/components/modules/groups/GroupMembers'
import MyGroups from 'app/components/modules/groups/MyGroups'
import TopGroups from 'app/components/modules/groups/TopGroups'
import Donate from 'app/components/modules/Donate'
import LoginForm from 'app/components/modules/LoginForm';
import AppDownload from 'app/components/modules/app/AppDownload'
import user from 'app/redux/UserReducer'
//import tr from 'app/redux/Transaction';
import isScreenSmall from 'app/utils/isScreenSmall'

let keyIndex = 0;

class Modals extends React.Component {
    static propTypes = {
        show_login_modal: PropTypes.bool,
        show_donate_modal: PropTypes.bool,
        show_create_group_modal: PropTypes.bool,
        show_my_groups_modal: PropTypes.bool,
        show_top_groups_modal: PropTypes.bool,
        show_group_settings_modal: PropTypes.bool,
        show_group_members_modal: PropTypes.bool,
        show_app_download_modal: PropTypes.bool,
        hideDonate: PropTypes.func.isRequired,
        hideAppDownload: PropTypes.func.isRequired,
        notifications: PropTypes.object,
        removeNotification: PropTypes.func,
    };

    onLoginBackdropClick = (e) => {
        const { loginUnclosable } = this.props;
        if (loginUnclosable)
            this.onUnclosableClick(e)
    };

    onUnclosableClick = (e) => {
        throw new Error('Closing modal is forbidden here')
    }

    render() {
        const {
            show_login_modal,
            show_donate_modal,
            show_create_group_modal,
            show_my_groups_modal,
            show_top_groups_modal,
            show_group_settings_modal,
            show_group_members_modal,
            show_app_download_modal,
            hideLogin,
            hideDonate,
            hideCreateGroup,
            hideMyGroups,
            hideTopGroups,
            hideGroupSettings,
            hideGroupMembers,
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

        let modalStyle = {
            overflowX: 'hidden',
        }
        if (!isScreenSmall()) {
            modalStyle = {
                borderRadius: '8px',
                boxShadow: '0 0 19px 3px rgba(0,0,0, 0.2)',
                ...modalStyle,
            }
        }

        const doHideLogin = (e) => {
            const goBack = () => {
                const { history, } = this.props
                if (history.action !== 'POP') {
                    history.goBack()
                } else {
                    history.push('/')
                }
            }
            hideLogin(e, goBack)
        }

        return (
            <div>
                {show_login_modal && <Reveal revealStyle={{ ...modalStyle, }} onBackdropClick={this.onLoginBackdropClick}
                    onHide={doHideLogin} show={show_login_modal}>
                    <LoginForm onCancel={doHideLogin} />
                </Reveal>}
                {show_donate_modal && <Reveal revealStyle={{ ...modalStyle, }}
                    onHide={hideDonate} show={show_donate_modal}>
                    <CloseButton onClick={hideDonate} />
                    <Donate />
                </Reveal>}
                {show_create_group_modal && <Reveal enforceFocus={false} onBackdropClick={this.onUnclosableClick} revealStyle={{ ...modalStyle }}
                    onHide={hideCreateGroup} show={show_create_group_modal}>
                    <CloseButton onClick={hideCreateGroup} />
                    <CreateGroup closeMe={hideCreateGroup} />
                </Reveal>}
                {show_my_groups_modal && <Reveal enforceFocus={false} revealStyle={{ ...modalStyle, }}
                    onHide={hideMyGroups} show={show_my_groups_modal}>
                    <CloseButton onClick={hideMyGroups} />
                    <MyGroups closeMe={hideMyGroups} />
                </Reveal>}
                {show_top_groups_modal && <Reveal enforceFocus={false} revealStyle={{ ...modalStyle, }}
                    onHide={hideTopGroups} show={show_top_groups_modal}>
                    <CloseButton onClick={hideTopGroups} />
                    <TopGroups closeMe={hideTopGroups} />
                </Reveal>}
                {show_group_settings_modal && <Reveal enforceFocus={false} revealStyle={{ ...modalStyle, }}
                    onHide={hideGroupSettings} show={show_group_settings_modal}>
                    <CloseButton onClick={hideGroupSettings} />
                    <GroupSettings closeMe={hideGroupSettings} />
                </Reveal>}
                {show_group_members_modal && <Reveal enforceFocus={false} revealStyle={{ ...modalStyle, }}
                    onHide={hideGroupMembers} show={show_group_members_modal}>
                    <CloseButton onClick={hideGroupMembers} />
                    <GroupMembers closeMe={hideGroupMembers} />
                </Reveal>}
                {show_app_download_modal && <Reveal revealStyle={{ ...modalStyle, }}
                    onHide={hideAppDownload} show={show_app_download_modal}>
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

export default withRouter(connect(
    state => {
        const loginDefault = state.user.get('loginDefault');
        const loginUnclosable = loginDefault && loginDefault.get('unclosable');
        return {
            show_login_modal: state.user.get('show_login_modal'),
            show_donate_modal: state.user.get('show_donate_modal'),
            show_create_group_modal: state.user.get('show_create_group_modal'),
            show_my_groups_modal: state.user.get('show_my_groups_modal'),
            show_top_groups_modal: state.user.get('show_top_groups_modal'),
            show_group_settings_modal: state.user.get('show_group_settings_modal'),
            show_group_members_modal: state.user.get('show_group_members_modal'),
            show_app_download_modal: state.user.get('show_app_download_modal'),
            loginUnclosable,
            notifications: state.app.get('notifications'),
        }
    },
    dispatch => ({
        hideLogin: (e, goBack) => {
            if (e) e.preventDefault();
            if (goBack) {
                goBack()
            }
            dispatch(user.actions.hideLogin())
        },
        hideDonate: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideDonate())
        },
        hideCreateGroup: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideCreateGroup())
        },
        hideMyGroups: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideMyGroups())
        },
        hideTopGroups: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideTopGroups())
        },
        hideGroupSettings: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideGroupSettings())
        },
        hideGroupMembers: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideGroupMembers())
        },
        hideAppDownload: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideAppDownload())
        },
        
        // example: addNotification: ({key, message}) => dispatch({type: 'ADD_NOTIFICATION', payload: {key, message}}),
        removeNotification: (key) => dispatch({type: 'REMOVE_NOTIFICATION', payload: {key}}),

    })
)(Modals))
