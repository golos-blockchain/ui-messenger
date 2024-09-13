import React from 'react';

import ConversationSearch from 'app/components/elements/messages/ConversationSearch';
import ConversationListItem from 'app/components/elements/messages/ConversationListItem';
import Toolbar from 'app/components/elements/messages/Toolbar';
import { renderPart } from 'app/utils/misc'
import './ConversationList.css';

export default class ConversationList extends React.Component {
    render() {
        const { topLeft, topRight,
            conversationSelected, conversationLinkPattern, renderConversationAvatar, onConversationSearch,
            onConversationSelect,
            isSmall } = this.props;
        return (
            <div className='conversation-list'>
                <Toolbar
                    leftItems={renderPart(topLeft, { isSmall })}
                    rightItems={renderPart(topRight, { isSmall })}
                />
                <ConversationSearch onSearch={onConversationSearch} />
                {
                    this.props.conversations.map(conversation =>
                        <ConversationListItem
                            key={conversation.contact}
                            data={conversation}
                            selected={conversationSelected === conversation.contact}
                            conversationLinkPattern={conversationLinkPattern}
                            renderConversationAvatar={renderConversationAvatar}
                            onConversationSelect={onConversationSelect}
                        />
                    )
                }
            </div>
        );
    }
}
