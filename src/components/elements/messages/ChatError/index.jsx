import React from 'react'
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'
import './ChatError.scss'

class ChatError extends React.Component {
    render() {
        const { isGroup, error } = this.props

        if (error === 404) {
            return <div className='ChatError'>
                <center><Icon name='golos' size='3x' /></center>
                <h5 style={{ marginTop: '0.5rem' }}>{isGroup ? tt('msgs_chat_error.404_group') : tt('msgs_chat_error.404_acc')}</h5>
                <div>{tt('msgs_chat_error.404_but')}</div>
            </div>
        }

        return <div className='ChatError'>
            <h5 style={{ marginTop: '0.5rem' }}>{tt('msgs_chat_error.500_group')}</h5>
            <div>{tt('msgs_chat_error.500_load_msgs')}</div>
            <pre>{error}</pre>
        </div>
    }
}

export default ChatError
