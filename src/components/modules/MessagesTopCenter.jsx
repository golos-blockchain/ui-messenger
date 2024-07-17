import React from 'react'
import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'
import tt from 'counterpart'

import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import user from 'app/redux/UserReducer'
import { getGroupLogo, } from 'app/utils/groups'
import { getLastSeen } from 'app/utils/NormalizeProfile'

class MessagesTopCenter extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
        this.dropdown = React.createRef()
    }

    openDropdown = (e) => {
        e.preventDefault()
        this.dropdown.current.click()
    }

    showGroupMembers = (e) => {
        e.preventDefault()
        const { the_group } = this.props
        if (!the_group) return
        this.props.showGroupMembers({ group: the_group })
    }

    _renderGroupDropdown = () => {
        return <div>
            Test
        </div>
    }

    render() {
        let avatar = []
        let items = []

        const { to, toAcc, isSmall, notifyErrors, the_group } = this.props

        const isGroup = to && !to.startsWith('@')

        let checkmark
        if (to === '@notify') {
            checkmark = <span className='msgs-checkmark'>
                <Icon name='ionicons/checkmark-circle' size='0_95x' title={tt('messages.verified_golos_account')} />
            </span>
        }

        if (isGroup) {
            if (the_group) {
                const { json_metadata } = the_group
                const logo = getGroupLogo(json_metadata)
                avatar.push(<div className='group-logo' onClick={this.openDropdown}>
                    <img src={logo} />
                </div>)
            }
            items.push(<div key='to-link' style={{fontSize: '15px', width: '100%', }}>
                <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="right"
                    dropdownContent={this._renderGroupDropdown()}
                >
                    <span className='to-group' ref={this.dropdown}>{to}</span>
                </LinkWithDropdown>
                {checkmark}
            </div>)
        } else {
            items.push(<div key='to-link' style={{fontSize: '15px', width: '100%', textAlign: 'center'}}>
                <ExtLink href={to}>{to}{checkmark}</ExtLink>
            </div>)
        }

        if (notifyErrors >= 30) {
            items.push(<div key='to-last-seen' style={{fontSize: '13px', fontWeight: 'normal', color: 'red'}}>
                {isSmall ?
                    <span>
                        {tt('messages.sync_error_short')}
                        <a href='#' onClick={e => { e.preventDefault(); this.props.fetchState(this.props.to) }}>
                            {tt('g.refresh').toLowerCase()}.
                        </a>
                    </span> :
                    <span>{tt('messages.sync_error')}</span>
                }
            </div>)
        } else {
            const secondStyle = {fontSize: '13px', fontWeight: 'normal'}
            if (!isGroup) {
                const { accounts } = this.props
                const acc =accounts[toAcc]
                let lastSeen = acc && getLastSeen(acc)
                if (lastSeen) {
                    items.push(<div key='to-last-seen' style={secondStyle}>
                        {
                            <span>
                                {tt('messages.last_seen')}
                                <TimeAgoWrapper date={`${lastSeen}`} />
                            </span>
                        }
                    </div>)
                }
            } else {
                const { the_group } = this.props
                if (the_group) {
                    const totalMembers = the_group.members + the_group.moders
                    items.push(<div key='group-stats' className='group-stats'
                            style={secondStyle} onClick={this.showGroupMembers}>
                        {tt('plurals.member_count', {
                            count: totalMembers
                        })}
                    </div>)
                }
            }
        }

        return <div className='MessagesTopCenter'>
            <div className='avatar-items'>{avatar}</div>
            <div className='main-items'>{items}</div>
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.get('current')
        const accounts = state.global.get('accounts')

        const username = state.user.getIn(['current', 'username'])

        let the_group = state.global.get('the_group')
        if (the_group && the_group.toJS) the_group = the_group.toJS()

        return {
            the_group,
            account: currentUser && accounts && accounts.toJS()[currentUser.get('username')],
            currentUser,
            accounts: accounts ?  accounts.toJS() : {},
            username,
        }
    },
    dispatch => ({
        showGroupMembers({ group }) {
            dispatch(user.actions.showGroupMembers({ group }))
        },
    }),
)(MessagesTopCenter)
