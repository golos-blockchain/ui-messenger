import React from 'react';
import tt from 'counterpart';
import { Asset } from 'golos-lib-js/lib/utils'

import Donating from 'app/components/elements/messages/Donating'
import Userpic from 'app/components/elements/Userpic'
import { displayQuoteMsg } from 'app/utils/MessageUtils';
import { proxifyImageUrl } from 'app/utils/ProxifyUrl';
import './Message.css';

export default class Message extends React.Component {
    onMessageSelect = (idx, event) => {
        if (this.props.onMessageSelect) {
            const { data, selected } = this.props;
            this.props.onMessageSelect(data, idx, !selected, event);
        }
    };

    doNotSelectMessage = (event) => {
        event.stopPropagation();
    };

    render() {
        const {
            idx,
            data,
            isMine,
            startsSequence,
            endsSequence,
            showTimestamp,
            selected,
        } = this.props;

        const friendlyDate = data.date.toLocaleString();

        const loading = (!data.receive_date || data.receive_date.startsWith('19') || data.deleting) ? ' loading' : ''; 

        const unread = data.unread ? (<div className={'unread' + loading}>●</div>) : null;

        const { message, group, from} = data;

        let content;
        if (message.type === 'image') {
            const src = proxifyImageUrl(message.body);
            const srcPreview = proxifyImageUrl(message.body, '600x300');
            const previewWidth = message.previewWidth ? message.previewWidth + 'px' : 'auto';
            const previewHeight = message.previewHeight ? message.previewHeight + 'px' : 'auto';

            content = (<a href={src} target='_blank' rel='noopener noreferrer' tabIndex='-1' onClick={this.doNotSelectMessage}>
                <img src={srcPreview} alt={src} style={{width: previewWidth, height: previewHeight, objectFit: 'cover'}} />
            </a>);
        } else {
            let lineKey = 1;
            content = message.body.split('\n').map(line => {
                let spans = [];
                const words = line.split(' ');
                let key = 1;
                for (let word of words) {
                    // eslint-disable-next-line
                    if (word.length > 4 && /^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$/.test(word)) {
                        let href = word;
                        if (!href.startsWith('http://') && !href.startsWith('https://')) {
                            href = 'http://' + href;
                        }
                        spans.push(<a href={href} target='_blank' rel='noopener noreferrer' key={key} tabIndex='-1' onClick={this.doNotSelectMessage}>{word}</a>);
                        spans.push(' ');
                    } else if (word.length <= 2 && /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(word)) {
                        spans.push(<span key={key++} style={{fontSize: '20px'}}>{word}</span>);
                        spans.push(' ');
                    } else {
                        spans.push(word + ' ');
                    }
                }
                return (<span key={lineKey++}>{spans}<br/></span>);
            });
        }

        let quoteHeader = null;
        if (message.quote) {
            const { quote } = message;
            let quoteBody = null;
            if (quote.type === 'image') {
                quoteBody = <img src={proxifyImageUrl(quote.body, '600x300')} title={quote.body} />
            } else {
                quoteBody = displayQuoteMsg(quote.body);
            }
            quoteHeader = (<div className='quote'>
                <div className='quote-from'>
                    {quote.from}
                </div>
                {quoteBody}
            </div>);
        }

        const modified = (data.receive_date !== data.create_date) && !data.receive_date.startsWith('19');

        const hasDonates = Asset(data.donates).amount || data.donates_uia
        const gift = <Donating data={data} isMine={isMine} />
        let adds = [ gift ]
        if (!hasDonates || !isMine) {
            adds.unshift(unread)
        }

        let avatar
        if (!isMine && group) {
            if (startsSequence) {
                avatar = <Userpic account={from} title={'@' + from} width={32} height={32} />
            }
            avatar = <div className='avatar'>
                {avatar} 
            </div>
        }

        return (
            <div className={[
                'msgs-message',
                `${isMine ? 'mine' : ''}`,
                `${startsSequence ? 'start' : ''}`,
                `${endsSequence ? 'end' : ''}`
            ].join(' ')}>
                {
                    showTimestamp &&
                        <div className='timestamp'>
                            { friendlyDate }
                        </div>
                }

                <div className={'bubble-container' + (selected ? ' selected' : '')}>
                    {avatar}
                    {isMine ? adds : null}
                    <div className={'bubble' + loading} onClick={(event) => this.onMessageSelect(idx, event)} title={friendlyDate + (modified ? tt('g.modified') : '')}>
                        { quoteHeader }
                        { content }
                    </div>
                    {!isMine ? adds : null}
                </div>
            </div>
        );
    }
}
