import React from 'react'
import {connect} from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import tt from 'counterpart'
import cn from 'classnames'

import Icon from 'app/components/elements/Icon'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import { broadcastOperation } from 'app/redux/TransactionSlice';
import { getRoleInGroup } from 'app/utils/groups'
import { getLastSeen } from 'app/utils/NormalizeProfile'

import './AuthorDropdown.scss'

class AuthorDropdown extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    btnClick = (e, isBanned) => {
        e.preventDefault()
        const { author, username, the_group } = this.props
        if (!the_group) {
            return
        }
        this.setState({submitting: true})

        const member_type = isBanned ? 'member' : 'banned'
        this.props.groupMember({
            requester: username, group: the_group.name,
            member: author,
            member_type,
            onSuccess: () => {
                this.setState({submitting: false})
                document.body.click()
            },
            onError: (err, errStr) => {
                this.setState({submitting: false})
                alert(errStr)
            }
        })
    }

    render() {
        const { author, authorAcc, the_group, account } = this.props

        let lastSeen
        if (authorAcc) {
            lastSeen = getLastSeen(authorAcc)
        }

        let isModer
        if (the_group && account) {
            const { amModer } = getRoleInGroup(the_group, account.name)
            isModer = amModer
        }

        let banBtn
        if (isModer) {
            const isBanned = authorAcc && authorAcc.member_type === 'banned'
            const isOwner = the_group && the_group.owner === author
            banBtn = <button className={cn('button hollow small btn', {
                alert: !isBanned,
                banned: isBanned,
                disabled: isOwner,
            })} onClick={e => this.btnClick(e, isBanned)} disabled={this.state.submitting}>
                <Icon name='ionicons/ban' />
                <span className='title'>{isBanned ? tt('group_members_jsx.unban') :
                    tt('group_members_jsx.ban')}</span>
            </button>
        }

        return <div className='AuthorDropdown'>
            <div className='link'>
                <Link to={'/@' + author}>{'@' + author}</Link>
            </div>
            {lastSeen ? <div className='last-seen'>
                {tt('messages.last_seen')}
                <TimeAgoWrapper date={`${lastSeen}`} />
            </div> : lastSeen}
            <div className='btns'>
                {banBtn}
            </div>
        </div>
    }
}

export default withRouter(connect(
    (state, ownProps) => {
        const currentUser = state.user.current
        const accounts = state.global.accounts

        let authorAcc = accounts && accounts[ownProps.author];
        authorAcc = authorAcc || null;

        let the_group = state.global.the_group

        const username = state.user.current && state.user.current.username

        return {
            username,
            authorAcc,
            the_group,
            account: currentUser && accounts && accounts[currentUser.username],
        }
    },
    dispatch => ({
        groupMember: ({ requester, group, member, member_type,
        onSuccess, onError }) => {
            const opData = {
                requester,
                name: group,
                member,
                member_type,
                json_metadata: '{}',
                extensions: [],
            }

            const plugin = 'private_message'
            const json = JSON.stringify(['private_group_member', opData])

            dispatch(broadcastOperation({
                type: 'custom_json',
                operation: {
                    id: plugin,
                    required_posting_auths: [requester],
                    json,
                },
                username: requester,
                successCallback: onSuccess,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }));
        },
    }),
)(AuthorDropdown))
