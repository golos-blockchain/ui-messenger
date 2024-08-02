import React from 'react'
import {connect} from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import { Fade } from 'react-foundation-components/lib/global/fade'
import { LinkWithDropdown } from 'react-foundation-components/lib/global/dropdown'
import tt from 'counterpart'
import cn from 'classnames'

import DialogManager from 'app/components/elements/common/DialogManager'
import { showLoginDialog } from 'app/components/dialogs/LoginDialog'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'
import TimeAgoWrapper from 'app/components/elements/TimeAgoWrapper'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import { getMemberType, getGroupLogo, getGroupMeta, getGroupTitle, } from 'app/utils/groups'
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
        let isInside = false
        let node = e.target
        while (node.parentNode) {
            if (node.className.includes('msgs-group-dropdown')) {
                isInside = true
                return
            }
            node = node.parentNode
        }
        if (isInside) return
        this.dropdown.current.click()
    }

    closeDropdown = (e) => {
        e.preventDefault()
        this.dropdown.current.click()
    }

    showGroupMembers = (e) => {
        e.preventDefault()
        const { the_group } = this.props
        if (!the_group) return
        const { name } = the_group
        this.props.showGroupMembers({ group: name })
    }

    editGroup = (e) => {
        e.preventDefault()
        const { the_group } = this.props
        if (!the_group) return
        this.props.showGroupSettings({ group: the_group })
    }

    deleteGroup = (e, title) => {
        e.preventDefault()
        const { history, the_group } = this.props
        if (!the_group) return
        showLoginDialog(the_group.owner, (res) => {
            const password = res && res.password
            if (!password) {
                return
            }
            this.props.deleteGroup({
                owner: the_group.owner,
                name: the_group.name,
                password,
                onSuccess: () => {
                    if (!history || !history.push) {
                        console.error('No react-router history', history)
                        return
                    }
                    history.push('/')
                },
                onError: (err, errStr) => {
                    alert(errStr)
                }
            })
        }, 'active', false, tt('my_groups_jsx.login_hint_GROUP', {
            GROUP: title
        }))
    }

    _renderGroupDropdown = () => {
        const { the_group, username } = this.props
        if (!the_group) {
            return null
        }

        const { name, json_metadata, privacy, is_encrypted,
            owner, member_list, members, moders } = the_group
        const logo = getGroupLogo(json_metadata)

        const meta = getGroupMeta(json_metadata)
        const title = getGroupTitle(meta, name)

        const totalMembers = members + moders

        let groupType
        if (privacy === 'public_group') {
            groupType = tt('msgs_group_dropdown.public')
        } else if (privacy === 'public_read_only') {
            groupType = tt('msgs_group_dropdown.read_only')
        } else {
            groupType = tt('msgs_group_dropdown.private')
        }
        groupType = <div className='group-type'>{groupType}</div>

        let myStatus = null
        let btnType
        let showKebab, isOwner, banned
        if (owner === username) {
            myStatus = tt('msgs_group_dropdown.owner')
            showKebab = true
        } else {
            const member_type = getMemberType(member_list, username)

            const isMember = member_type === 'member'
            const isModer = member_type === 'moder'

            if (!member_type) {
                btnType = 'join'
            } else if (isModer) {
                myStatus = tt('msgs_group_dropdown.moder')
                btnType = 'retire'
            } else if (isMember) {
                btnType = 'retire'
            } else if (member_type === 'banned') {
                myStatus = tt('msgs_group_dropdown.banned')
                banned = true
                btnType = 'disabled'
            } else if (member_type === 'pending') {
                myStatus = tt('msgs_group_dropdown.pending')
                btnType = 'cancel'
            }
        }
        if (myStatus) {
            myStatus = <div className='group-type'>{myStatus}</div>
        }

        let btn
        if (btnType) {
            const onBtnClick = async (e) => {
                e.preventDefault()

                if (btnType === 'retire') {
                    this.closeDropdown(e)

                    let retireWarning
                    if (privacy !== 'public_group') {
                        retireWarning = <span><br/>{tt('msgs_group_dropdown.joining_back_will_require_approval')}</span>
                    }

                    const res = await DialogManager.dangerConfirm(<div>
                        {tt('msgs_group_dropdown.are_you_sure_retire') + ' ' + title + '?'}{retireWarning}</div>,
                        'GOLOS Messenger')
                    if (!res) return
                } else {
                    setTimeout(() => {
                        this.closeDropdown(e)
                    }, 500)
                }

                const groupPublic = privacy === 'public_group'
                const member_type = btnType === 'join' ? (groupPublic ? 'member' : 'pending') : 'retired'
                this.props.groupMember({
                    requester: username, group: name,
                    member: username,
                    member_type,
                    onSuccess: () => {
                    },
                    onError: (err, errStr) => {
                        alert(errStr)
                    }
                })
            }

            if (btnType === 'join') {
                btn = <button onClick={onBtnClick} className='button small margin float-right'>
                    {tt('msgs_group_dropdown.join')}
                </button>
            } else {
                let btnTitle = tt('msgs_group_dropdown.retire')
                if (btnType === 'cancel') {
                    btnTitle = tt('msgs_group_dropdown.cancel')
                }
                btn = <button onClick={onBtnClick} className='button small margin hollow alert float-right' disabled={btnType === 'disabled'}>
                    {btnTitle}
                </button>
            }
        }

        let kebabItems = [
            { link: '#', value: tt('g.edit'), onClick: this.editGroup },
            { link: '#', value: tt('g.delete'), onClick: e => this.deleteGroup(e, title) },
        ]

        const lock = <Icon size='0_5x'
            title={is_encrypted ? tt('msgs_group_dropdown.encrypted') : tt('msgs_group_dropdown.not_encrypted')}
            name={is_encrypted ? 'ionicons/lock-closed-outline' : 'ionicons/lock-open-outline'} />

        return <div className='msgs-group-dropdown'>
            <img className='logo' src={logo} />
            <div className='title'>
                <b>{title}</b>&nbsp;{lock}
            </div>
            {groupType}
            {myStatus}
            <div className='buttons'>
                {showKebab ? <DropdownMenu className='float-right' el='div' items={kebabItems}>
                    <Icon name='new/more' size='0_95x' />
                </DropdownMenu> : null}
                <button className='button small hollow float-right' onClick={e => {
                    this.closeDropdown(e)
                    this.showGroupMembers(e)
                }}>{tt('my_groups_jsx.members') + ' (' + totalMembers + ')'}</button>
                {btn}
            </div>
        </div>
    }

    render() {
        let avatar = []
        let items = []
        let clickable = false

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
                avatar.push(<div className='group-logo'>
                    <img src={logo} />
                </div>)
            }
            items.push(<div key='to-link' style={{fontSize: '15px', width: '100%', }}>
                <LinkWithDropdown
                    closeOnClickOutside
                    dropdownPosition="bottom"
                    dropdownAlignment="center"
                    dropdownContent={this._renderGroupDropdown()}
                    transition={Fade}
                >
                    <span className='to-group' ref={this.dropdown}>{to}</span>
                </LinkWithDropdown>
                {checkmark}
            </div>)
            clickable = true
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
                            style={secondStyle}>
                        {tt('plurals.member_count', {
                            count: totalMembers
                        })}
                    </div>)
                }
            }
        }

        return <div className={cn('MessagesTopCenter', {
            clickable
        })} onClick={clickable ? this.openDropdown : null}>
            <div className='avatar-items'>{avatar}</div>
            <div className='main-items'>{items}</div>
        </div>
    }
}

export default withRouter(connect(
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

            dispatch(transaction.actions.broadcastOperation({
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
        showGroupMembers({ group }) {
            dispatch(user.actions.showGroupMembers({ group: ['the_group', group] }))
        },
        showGroupSettings({ group }) {
            dispatch(user.actions.showGroupSettings({ group }))
        },
        deleteGroup: ({ owner, name, password,
        onSuccess, onError }) => {
            const opData = {
                owner,
                name,
                extensions: [],
            }

            const json = JSON.stringify(['private_group_delete', opData])

            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                operation: {
                    id: 'private_message',
                    required_auths: [owner],
                    json,
                },
                username: owner,
                keys: [password],
                successCallback: onSuccess,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }));
        }
    }),
)(MessagesTopCenter))
