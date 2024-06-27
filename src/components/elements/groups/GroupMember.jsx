import React from 'react'
import tt from 'counterpart'
import cn from 'classnames'

import Icon from 'app/components/elements/Icon'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import Userpic from 'app/components/elements/Userpic'

class GroupMember extends React.Component {
    // shouldComponentUpdate(nextProps) {
    //     const { member } = this.props
    //     if (member.member_type !== nextProps.member_type) {
    //         return true
    //     }
    //     return false
    // }

    groupMember = (e, member, setMemberType) => {
        e.preventDefault()
        const { username, currentGroup } = this.props
        const { account } = member
        const currentMemberType = member.member_type

        if (currentMemberType === setMemberType) return;
        if (username === account) return
        const group = currentGroup.name

        // Update in UI immediately
        this.props.updateGroupMember(group, account, setMemberType)

        const { creatingNew } = currentGroup
        if (!creatingNew) {
            this.props.groupMember({
                requester: username, group,
                member: account,
                member_type: setMemberType,
                onSuccess: () => {
                },
                onError: (err, errStr) => {
                    // Update it back!
                    this.props.updateGroupMember(group, account, currentMemberType)

                    if (errStr.includes('duplicate transaction')) {
                        // "Too Many Requests" - just nothing action, not alert
                        return
                    }
                    alert(errStr)
                }
        })
        }
    }

    render() {
        const { member, username, currentGroup } = this.props
        const { account, member_type, joined } = member
        const { creatingNew } = currentGroup

        const isMe = username === account
        const isOwner = currentGroup.owner === account
        const isMember = !isOwner && member_type === 'member'
        const isModer = !isOwner && member_type === 'moder'
        const isBanned = !isOwner && member_type === 'banned'

        let memberTitle, moderTitle, banTitle
        let memberBtn, moderBtn, banBtn, deleteBtn
        let ownerTitle = tt('group_members_jsx.owner')
        if (account !== username) {
            memberTitle = (isMember && tt('group_members_jsx.member')) ||
                (isBanned && tt('group_members_jsx.unban')) ||
                (!isMember && tt('group_members_jsx.make_member'))
            moderTitle = (isModer && tt('group_members_jsx.moder')) ||
                tt('group_members_jsx.make_moder')
            banTitle = (isBanned && tt('group_members_jsx.unban')) ||
                tt('group_members_jsx.ban')
        } else {
            memberTitle = tt('group_members_jsx.member')
            moderTitle = tt('group_members_jsx.moder')
            banTitle = tt('group_members_jsx.banned')
        }

        if (!creatingNew) {
            if (!isMe || isBanned) {
                banBtn = <Icon className={cn('member-btn ban', { selected: isBanned })}
                    title={banTitle} name='ionicons/ban' size='1_25x'
                    onClick={e => this.groupMember(e, member, 'banned')} />
            }
        } else {
            deleteBtn = <Icon className={'member-btn delete'} title={tt('g.delete')} name='cross' size='1x'
                    onClick={e => this.groupMember(e, member, 'retired')} />
        }

        return <tr key={account}>
            <td style={{ paddingBottom: '0px' }}>
                <a href={'/@' + account} target='_blank' rel='noopener noreferrer'>
                    <Userpic account={account} title={account} width={40} height={40} />
                    <span className='member-name'>
                        {account}
                    </span>
                </a>
            </td>
            <td>
                {!creatingNew && <TimeAgoWrapper date={joined} />}
            </td>
            <td className='member-btns'>
                {isOwner && <Icon className={cn('member-btn owner selected')}
                    title={ownerTitle}
                    name='ionicons/checkmark-circle' size='1_5x' />}
                {(!isMe || isMember) && <Icon className={cn('member-btn member', { selected: isMember })}
                    title={memberTitle} 
                    name='ionicons/person' size='1_5x' onClick={e => this.groupMember(e, member, 'member')} />}
                {(!isMe || isModer) && <Icon className={cn('member-btn moder', { selected: isModer })}
                    title={moderTitle}
                    name='ionicons/person-add' size='1_5x' onClick={e => this.groupMember(e, member, 'moder')} />}
                {banBtn}
                {deleteBtn}
            </td>
        </tr>
    }
}

export default GroupMember
