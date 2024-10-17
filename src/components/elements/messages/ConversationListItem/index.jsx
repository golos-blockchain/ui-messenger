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
            //avatarSrc: require('app/assets/images/user.png'),
            avatarSrc: null,
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
            const { data } = this.props
            const { contact } = data
            const pattern = conversationLinkPattern(data)
            return pattern.replace('*', contact)
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

    _renderAvatar = () => {
        const defaultRender = (src) => {
            return <img className='conversation-photo' src={src} alt={''} />
        }
        const { renderConversationAvatar } = this.props
        if (!renderConversationAvatar) {
            return defaultRender(this.state.avatarSrc)
        }
        return renderConversationAvatar(this.props.data, defaultRender)
    }

    render() {
        const { selected } = this.props;
        const { avatar, isSystemMessage, contact, last_message, size, unread_donate, kind } = this.props.data;

        const link = this.makeLink();

        const unreadDonate = unread_donate ? <span className='conversation-unread-donate'>
            <Icon name='ionicons/gift'></Icon>
            </span> : null

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

        let title = ''

        const unreadMessages = size && size.unread_inbox_messages
        const unreadMentions = size && size.unread_mentions

        if (!unread && unreadMessages) {
            unread = (<div className='conversation-unread'>
                {unreadMessages}
            </div>)
            if (kind === 'group') {
                title += tt('plurals.reply_count', { count: unreadMessages })
            }
        }

        if (unreadMentions) {
            unread = <React.Fragment>
                <div className='conversation-unread mention'>
                    {unreadMentions}
                </div>
                {unread}
            </React.Fragment>
            if (kind === 'group') {
                if (title) title += ', '
                title += tt('plurals.mention_count', { count: unreadMentions })
            }
        }

        let checkmark
        if (contact === 'notify') {
            checkmark = <span className='msgs-checkmark' title={tt('messages.verified_golos_account')}>
                    <Icon name='ionicons/checkmark-circle' size='0_95x' />
                </span>
        }

        return (
            <Link to={isSystemMessage ? null : link} className={'conversation-list-item' + (selected ? ' selected' : '')} title={title}>
                {this._renderAvatar()}
                <div className='conversation-info'>
                    <h1 className='conversation-title'>{contact}{checkmark}</h1>
                    <div className='conversation-snippet'>{last_body && truncate(last_body, {length: 30})}
                    </div>
                    {unread}
                    {unreadDonate}
                </div>
            </Link>
        );
    }
}
