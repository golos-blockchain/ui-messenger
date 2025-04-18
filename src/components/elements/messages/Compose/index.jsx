import React from 'react';
import tt from 'counterpart';
import cn from 'classnames'
import { Picker } from 'emoji-picker-element';
import TextareaAutosize from 'react-textarea-autosize';

import Icon from 'app/components/elements/Icon';
import { displayQuoteMsg } from 'app/utils/MessageUtils';
import './Compose.css';

const fixComposeSize = () => {
    const sb = document.getElementsByClassName('msgs-sidebar')[0]
    let cw = '100%'
    if (sb) {
        cw = 'calc(100% - ' + sb.offsetWidth + 'px)'
    }
    const compose = document.getElementsByClassName('msgs-compose')[0]
    if (compose) {
        compose.style.width = cw
    }
}

export default class Compose extends React.Component {
    onKeyDown = (e) => {
        if (!window.IS_MOBILE_DEVICE && e.keyCode === 13) {
            if (e.shiftKey) {
            } else {
                e.preventDefault();
                const { onSendMessage } = this.props;
                onSendMessage(e.target.value, e);
            }
        }
    };

    onSendClick = (e) => {
        e.preventDefault();
        const { onSendMessage } = this.props;
        const input = document.getElementsByClassName('msgs-compose-input')[0];
        input.focus();
        onSendMessage(input.value, e);
    };

    init = () => {
        this._tooltip = document.querySelector('.msgs-emoji-picker-tooltip');
        if (!this._tooltip)
            return;

        if (this._tooltip.childNodes.length)
            return;

        this._picker = new Picker({
            locale: tt.getLocale(),
            i18n: tt('emoji_i18n'),
        });

        this._picker.classList.add('light')
        this._picker.addEventListener('emoji-click', this.onEmojiSelect);

        this._tooltip.appendChild(this._picker);

        setTimeout(() => {
            const button = document.querySelector('.msgs-emoji-picker-opener');
            if (button) {
                button.addEventListener('click', this.onEmojiClick);
                document.body.addEventListener('click', this.onBodyClick);
            }
        }, 500);
    };

    componentDidMount() {
        this.init();
        fixComposeSize()
        window.addEventListener('resize', fixComposeSize)
    }

    componentDidUpdate() {
        this.init();
    }

    componentWillUnmount() {
        window.removeEventListener('resize', fixComposeSize)
    }

    onEmojiClick = (event) => {
        event.stopPropagation();

        const { stub } = this.props
        if (stub) return

        this._tooltip.classList.toggle('shown');
        if (!this._tooltip.classList.contains('shown')) {
            const input = document.getElementsByClassName('msgs-compose-input')[0];
            if (input) {
                input.focus();
            }
        }
    };

    onBodyClick = (event) => {
        if (!this._tooltip) return;
        if (event.target.tagName.toLowerCase() === 'emoji-picker') return;
        this._tooltip.classList.remove('shown');
    };

    insertAtCursor(myField, myValue) {
        //IE support
        if (document.selection) {
            myField.focus();
            let sel = document.selection.createRange();
            sel.text = myValue;
        }
        //MOZILLA and others
        else if (myField.selectionStart || myField.selectionStart === '0') {
            let startPos = myField.selectionStart;
            let endPos = myField.selectionEnd;
            myField.value = myField.value.substring(0, startPos)
                + myValue
                + myField.value.substring(endPos, myField.value.length);
        } else {
            myField.value += myValue;
        }
    }

    onEmojiSelect = (event) => {
        event.stopPropagation();

        this._tooltip.classList.toggle('shown');

        const input = document.getElementsByClassName('msgs-compose-input')[0];
        if (input) {
            input.focus();
            this.insertAtCursor(input, ' ' + event.detail.unicode + ' ')
            this.onChange(input.value)
        }
    };

    onPaste = (event) => {
        try {
            if (event.clipboardData) {
                let fileName = null;

                for (let item of event.clipboardData.items) {
                    if (item.kind === 'string' && item.type === 'text/plain') {
                        try {
                            fileName = item.getAsString(a => (fileName = a));
                        } catch (err) {}
                    }

                    if (item.kind === 'file' && item.type.startsWith('image')) {
                        event.preventDefault();

                        const file = item.getAsFile();

                        if (this.props.onImagePasted) {
                            this.props.onImagePasted(file, fileName);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('Error analyzing clipboard event', err);
        }
    };

    onPanelDeleteClick = (event) => {
        if (this.props.onPanelDeleteClick) {
            this.props.onPanelDeleteClick(event);
        }
    }

    onPanelReplyClick = (event) => {
        if (this.props.onPanelReplyClick) {
            this.props.onPanelReplyClick(event);
        }
    }

    onPanelEditClick = (event) => {
        if (this.props.onPanelEditClick) {
            this.props.onPanelEditClick(event);
        }
    }

    onPanelCloseClick = (event) => {
        if (this.props.onPanelCloseClick) {
            this.props.onPanelCloseClick(event);
        }
    }

    onCancelReply = (event) => {
        if (this.props.onCancelReply) {
            this.props.onCancelReply(event);
        }
    }

    onHeightChange = (height) => {
        const cont = document.getElementsByClassName('message-list-container')[0];
        if (cont) {
            const oldPB = parseInt(cont.style.paddingBottom, 10) || 0; // if NaN, will be 0
            const newPB = 30 + height;
            cont.style.paddingBottom = newPB + 'px';

            const delta = newPB - oldPB;

            if (delta > 0) {
                const scroll = document.getElementsByClassName('msgs-content')[0];
                if (scroll) scroll.scrollTop += delta;
            }
        }
    }

    onChange = (value) => {
        const { onChange } = this.props
        if (onChange) {
            onChange(value)
        }
    }

    setInput = (val) => {
        const input = document.getElementsByClassName('msgs-compose-input')[0]
        if (input) {
            input.value = val
        }
        this.onChange(val)
    }

    render() {
        const { account, rightItems, replyingMessage, stub } = this.props
        const { onPanelDeleteClick, onPanelReplyClick, onPanelEditClick, onPanelCloseClick, onCancelReply } = this;

        const selectedMessages = Object.entries(this.props.selectedMessages);
        let selectedMessagesCount = 0;
        let selectedEditables = 0
        let selectedDeletables = 0
        for (let [nonce, info] of selectedMessages) {
            selectedMessagesCount++;
            if (info.editable) {
                selectedEditables++;
            }
            if (info.deletable) {
                selectedDeletables++
            }
        }

        let quote = null;
        if (replyingMessage) {
            quote = (<div className='msgs-compose-reply'>
                    <div className='msgs-compose-reply-from'>
                        {replyingMessage.quote.from}
                    </div>
                    {displayQuoteMsg(replyingMessage.quote.body)}
                    <Icon name={`cross`} size='0_95x' className='msgs-compose-reply-close' onClick={onCancelReply} />
                </div>);
        }

        const sendButton = (selectedMessagesCount && !stub) ? null :
            (<button className={cn('button small msgs-compose-send', {
                disabled: !!stub
            })} title={tt('g.submit')}
                    onClick={stub ? null : this.onSendClick}
                >
                <Icon name='new/envelope' size='1_25x' />
            </button>);

        return (
            <div className='msgs-compose'>
                {
                    (!selectedMessagesCount || stub) ? rightItems : null
                }

                {(!selectedMessagesCount || stub) ? (<div className='msgs-compose-input-panel'>
                    {stub ? null : quote}
                    {(stub && stub.ui) ? stub.ui : <TextareaAutosize
                        className='msgs-compose-input'
                        disabled={stub && stub.disabled}
                        placeholder={tt('messages.type_a_message')}
                        onKeyDown={this.onKeyDown}
                        onPaste={this.onPaste}
                        minRows={2}
                        maxRows={14}
                        onHeightChange={this.onHeightChange}
                        onChange={e => this.onChange(e.target.value)}
                    />}
                </div>) : null}

                {sendButton}

                {(selectedMessagesCount && !stub) ? (<div className='msgs-compose-panel'>
                    {(selectedMessagesCount === 1) ? (<button className='button small' onClick={onPanelReplyClick}>
                        <Icon name='reply' />
                        <span>{tt('g.reply')}</span>
                    </button>) : null}
                    <button className='button hollow small cancel-button' onClick={onPanelCloseClick}>
                        <Icon name='cross' />
                        <span>{tt('g.cancel')}</span>
                    </button>
                    {selectedDeletables === selectedMessagesCount ? <button className='button hollow small alert delete-button' onClick={onPanelDeleteClick}>
                        <Icon name='ionicons/trash-outline' />
                        <span>{tt('g.delete') + ' (' + selectedMessagesCount + ')'}</span>
                    </button> : null}
                    {(selectedMessagesCount === 1 && selectedEditables === 1) ? (<button className='button hollow small edit-button' onClick={onPanelEditClick}>
                        <Icon name='pencil' />
                        <span>{tt('g.edit')}</span>
                    </button>) : null}
                </div>) : null}
            </div>
        );
    }
}
