import React from 'react';
import { Link } from 'react-router-dom';
import truncate from 'lodash/truncate';
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'
import './ConversationListItem.css';

export default class ConversationListItem extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            avatarSrc: require('app/assets/images/user.png'),
        };
    }

    componentDidMount() {
        const { data } = this.props;
        if (data && data.avatar)
            this.setState({
                avatarSrc: data.avatar,
            });
    }

    componentDidUpdate(prevProps) {
        const prevAvatar = prevProps.data && prevProps.data.avatar
        const avatar = this.props.data && this.props.data.avatar
        if (avatar && avatar !== prevAvatar)
            this.setState({
                avatarSrc: avatar,
            })
    }

    makeLink = () => {
        const { conversationLinkPattern } = this.props;
        if (conversationLinkPattern) {
            const {  contact } = this.props.data;
            return conversationLinkPattern.replace('*', contact);
        }
        return null;
    };

    onClick = (event) => {
        const { onConversationSelect } = this.props;
        if (onConversationSelect) {
            event.preventDefault();
            onConversationSelect(this.props.data, this.makeLink(), event);
        }
    };

    render() {
        const { selected } = this.props;
        const { avatar, isSystemMessage, contact, last_message, size } = this.props.data;

        const link = this.makeLink();

        let last_body = null;
        let unread = null;
        if (last_message) {
            const { message } = last_message;
            if (message) {
                last_body = message.body;
            }

            if (last_message.unread)
                unread = (<div className='conversation-unread mine'>●</div>);
        }

        const unreadMessages = size && size.unread_inbox_messages;

        if (!unread && unreadMessages) {
            unread = (<div className='conversation-unread'>{unreadMessages}</div>);
        }

        let checkmark
        if (contact === 'notify') {
            checkmark = <span className='msgs-checkmark' title={tt('messages.verified_golos_account')}>
                    <Icon name='ionicons/checkmark-circle' size='0_95x' />
                </span>
        }

        return (
            <Link to={isSystemMessage ? null : link} className={'conversation-list-item' + (selected ? ' selected' : '')}>
                <img className='conversation-photo' src={this.state.avatarSrc} alt={''} />
                <div className='conversation-info'>
                    <h1 className='conversation-title'>{contact}{checkmark}</h1>
                    <div className='conversation-snippet'>{last_body && truncate(last_body, {length: 30})}
                    </div>
                    {unread}
                </div>
            </Link>
        );
    }
}
