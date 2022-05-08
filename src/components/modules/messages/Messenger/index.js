import React from 'react';
import Dropzone from 'react-dropzone';

import ConversationList from '../ConversationList';
import MessageList from '../MessageList';
import isScreenSmall from 'app/utils/isScreenSmall'
import './Messenger.css';

export default class Messages extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            isSmall: isScreenSmall()
        }
    }

    componentDidMount() {
        this._checkSmall()
        window.addEventListener('resize', this._checkSmall)
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._checkSmall)
    }

    _checkSmall = () => {
        const isSmall = isScreenSmall()
        if (this.state.isSmall !== isSmall) {
            this.setState({ isSmall })
        }
    }

    onDrop = (acceptedFiles, rejectedFiles, event) => {
        if (this.props.onImageDropped) {
            this.props.onImageDropped(acceptedFiles, rejectedFiles, event)
        }
    }

    render() {
        const { account, to,
            contacts, conversationTopLeft, conversationTopRight, conversationLinkPattern,
            onConversationSearch, onConversationSelect,
            messagesTopLeft, messagesTopCenter, messagesTopRight, messages, replyingMessage, onCancelReply, onSendMessage,
            onButtonImageClicked, onImagePasted,
            selectedMessages, onMessageSelect, onPanelDeleteClick, onPanelReplyClick, onPanelEditClick, onPanelCloseClick } = this.props;

        const { isSmall } = this.state

        return (
            <Dropzone
                className='messenger-dropzone'
                noClick
                multiple={false}
                accept='image/*'
                disabled={!to}
                onDrop={this.onDrop}
            >
                {({getRootProps, getInputProps, isDragActive}) => (<div className='messenger' {...getRootProps()}>
                    <input {...getInputProps()} />
                    {(!isSmall || !to) ? <div className='msgs-scrollable msgs-sidebar'>
                        <ConversationList
                            isSmall={isSmall}
                            topLeft={conversationTopLeft}
                            topRight={conversationTopRight}
                            account={account}
                            conversations={contacts}
                            conversationSelected={to}
                            conversationLinkPattern={conversationLinkPattern}
                            onConversationSearch={onConversationSearch}
                            onConversationSelect={onConversationSelect}
                            />
                    </div> : null}

                    {(!isSmall || to) ? <div className='msgs-scrollable msgs-content'>
                        <MessageList
                            account={account}
                            to={to}
                            isSmall={isSmall}
                            topLeft={messagesTopLeft}
                            topCenter={messagesTopCenter}
                            topRight={messagesTopRight}
                            renderEmpty={() => {
                                if (localStorage.getItem('msgr_auth') || process.env.IS_APP) return null
                                return (<img className='msgs-empty-chat' src='/msg_empty.png' />)
                            }}
                            messages={messages}
                            replyingMessage={replyingMessage}
                            onCancelReply={onCancelReply}
                            onSendMessage={onSendMessage}
                            selectedMessages={selectedMessages}
                            onMessageSelect={onMessageSelect}
                            onPanelDeleteClick={onPanelDeleteClick}
                            onPanelReplyClick={onPanelReplyClick}
                            onPanelEditClick={onPanelEditClick}
                            onPanelCloseClick={onPanelCloseClick}
                            onButtonImageClicked={onButtonImageClicked}
                            onImagePasted={onImagePasted}
                            />
                    </div> : null}

                    {isDragActive ? (<div className='messenger-dropzone-shade'>
                        <div className='messenger-dropzone-modal'>
                            Test
                        </div>
                    </div>) : null}
                </div>)}
            </Dropzone>
        );
    }
}
