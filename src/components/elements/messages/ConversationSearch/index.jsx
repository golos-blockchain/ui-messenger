import React from 'react';
import tt from 'counterpart';

import Icon from 'app/components/elements/Icon';
import './ConversationSearch.css';

export default class ConversationSearch extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
        };
    }

    search = (value, event) => {
        this.setState({
            query: value,
        });
        const { onSearch } = this.props
        if (onSearch) {
            onSearch(value, event)
        }
    };

    onChange = (event) => {
        this.search(event.target.value.toLowerCase(), event);
    };

    clear = (event) => {
        this.search('', event);
    };

    render() {
        return (
            <div className='conversation-search'>
                <input
                    type='text'
                    className='conversation-search-input'
                    placeholder={tt('messages.search')}
                    value={this.state.query}
                    onChange={this.onChange}
                />
                {this.state.query ? <div className='conversation-search-buttons'
                    onClick={this.clear}>
                    <Icon name={`cross`} size='0_75x' />
                </div> : null}
            </div>
        );
    }
}
