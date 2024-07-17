import React from 'react'
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'
import './ChatError.scss'

class ChatError extends React.Component {
    render() {
        const { isGroup } = this.props
        return <div className='ChatError'>
            <center><Icon name='golos' size='3x' /></center>
            <h5 style={{ marginTop: '0.5rem' }}>{isGroup ? tt('msgs_chat_error.404_group') : tt('msgs_chat_error.404_acc')}</h5>
            <div>{tt('msgs_chat_error.404_but')}</div>
        </div>
    }
}

export default ChatError
