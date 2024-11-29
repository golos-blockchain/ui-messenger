import React from 'react'
import tt from 'counterpart'
import {connect} from 'react-redux'

import Icon from 'app/components/elements/Icon'
import user from 'app/redux/UserReducer'
import './StartPanel.scss'

class StartPanel extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    startChat = (e) => {
        e.preventDefault()
        const inp = document.getElementsByClassName('conversation-search-input')
        if (!inp.length) {
            console.error('startChat - no conversation-search-input')
            return
        }
        if (inp.length > 1) {
            console.error('startChat - multiple conversation-search-input:', inp)
            return
        }
        inp[0].focus()
    }

    goCreateGroup = (e) => {
        e.preventDefault()
        this.props.showCreateGroup()
    }

    render() {
        return (
            <div>
                <img className='msgs-empty-chat' src='/msg_empty.png' />
                <div className='msgs-start-panel'>
                    <button className='button' onClick={this.startChat}>
                        <Icon name='pencil' size='1x' />
                        <span className='btn-title'>{tt('msgs_start_panel.start_chat')}</span>
                    </button>
                    <button className='button hollow last-button' onClick={this.goCreateGroup}>
                        <Icon name='voters' size='1x' />
                        <span className='btn-title'>{tt('msgs_start_panel.create_group')}</span>
                    </button>
                </div>
            </div>
        )
    }
}

export default connect(
    (state, ownProps) => {
        return { ...ownProps }
    },
    dispatch => ({
        showCreateGroup() {
            dispatch(user.actions.showCreateGroup({ redirectAfter: true }))
        },
    })
)(StartPanel)
