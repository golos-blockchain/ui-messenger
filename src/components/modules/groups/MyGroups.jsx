import React from 'react'
import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import { Map } from 'immutable'
import { api, formatter } from 'golos-lib-js'
import tt from 'counterpart'
import cn from 'classnames'

import DialogManager from 'app/components/elements/common/DialogManager'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import MarkNotificationRead from 'app/components/elements/MarkNotificationRead'
import NotifiCounter from 'app/components/elements/NotifiCounter'
import { showLoginDialog } from 'app/components/dialogs/LoginDialog'
import { getGroupLogo, getGroupMeta, getRoleInGroup } from 'app/utils/groups'
import isScreenSmall from 'app/utils/isScreenSmall'

class MyGroups extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loaded: false
        }
    }

    refetch = () => {
        const { currentUser } = this.props
        this.setState({
            currentTab: null,
        }, () => {
            this.props.fetchMyGroups(currentUser)
        })
    }

    componentDidMount = async () => {
        this.refetch()
    }

    showTopGroups = (e) => {
        e.preventDefault()
        const { username } = this.props
        this.props.showTopGroups(username)
    }

    createGroup = (e) => {
        e.preventDefault()
        this.props.showCreateGroup()
    }

    _renderGroupLogo = (group, meta) => {
        const { json_metadata } = group

        const logo = getGroupLogo(json_metadata).url
        return <td className='group-logo'>
            <img src={logo} title={meta.title || name} />
        </td>
    }

    deleteGroup = (e, group, title) => {
        e.preventDefault()
        showLoginDialog(group.owner, (res) => {
            const password = res && res.password
            if (!password) {
                return
            }
            this.props.deleteGroup({
                owner: group.owner,
                name: group.name,
                password,
                onSuccess: () => {
                    this.refetch()
                },
                onError: (err, errStr) => {
                    alert(errStr)
                }
            })
        }, 'active', false, tt('my_groups_jsx.login_hint_GROUP', {
            GROUP: title
        }))
    }

    retireCancel = async (e, group, title, isPending) => {
        e.preventDefault()
        e.stopPropagation()
        const { username } = this.props

        let retireWarning
        if (!isPending && group.privacy !== 'public_group') {
            retireWarning = <span><br/>{tt('msgs_group_dropdown.joining_back_will_require_approval')}</span>
        }
        const res = await DialogManager.dangerConfirm(<div>
            {(isPending ? tt('my_groups_jsx.are_you_sure_cancel') : tt('msgs_group_dropdown.are_you_sure_retire'))
             + ' ' + title + '?'}
            {retireWarning}</div>,
            'GOLOS Messenger')
        if (!res) return

        this.props.groupMember({
            requester: username, group: group.name,
            member: username,
            member_type: 'retired',
            onSuccess: () => {
                this.refetch()
            },
            onError: (err, errStr) => {
                alert(errStr)
            }
        })
    }

    showGroupSettings = (e, group) => {
        e.preventDefault()
        this.props.showGroupSettings({ group })
    }

    showGroupMembers = (e, group, current_tab) => {
        e.preventDefault()
        const { name } = group
        this.props.showGroupMembers({ group: name, current_tab })
    }

    onGoGroup = (e) => {
        const { closeMe } = this.props
        if (closeMe) closeMe()
    }

    _renderGroup = (group) => {
        const { name, json_metadata, pendings, members, moders, } = group

        const meta = getGroupMeta(json_metadata)

        const isSmall = isScreenSmall()

        const maxLength = isSmall ? 15 : 20
        let title = meta.title || name
        let titleShr = title
        if (titleShr.length > maxLength) {
            titleShr = titleShr.substring(0, maxLength - 3) + '...'
        }

        const kebabItems = []

        const { username } = this.props
        const { amOwner, amModer, amPending, amMember } = getRoleInGroup(group, username)        

        if (amOwner) {
            kebabItems.push({ link: '#', onClick: e => {
                this.showGroupSettings(e, group)
            }, value: tt('my_groups_jsx.edit') })
            kebabItems.push({ link: '#', onClick: e => {
                this.deleteGroup(e, group, titleShr)
            }, value: tt('g.delete') })
        }
        if (amMember/* || (amModer && !amOwner)*/) {
            kebabItems.push({ link: '#', onClick: e => {
                this.retireCancel(e, group, titleShr, amPending)
            }, value: tt('msgs_group_dropdown.retire') })
        }

        const noMembers = !pendings && !members && !moders

        return <tr key={name}>
            <Link to={'/' + name} onClick={this.onGoGroup}>
                {this._renderGroupLogo(group, meta)}
                <td title={title} className='group-title'>
                    {titleShr}
                </td>
                <td className='group-buttons' onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}>
                    {amPending ? <button className={cn('button hollow alert', {
                        'icon-only': isSmall
                    })} title={
                        amPending ? tt('msgs_group_dropdown.pending') : null} onClick={e => {
                        this.retireCancel(e, group, titleShr, amPending)
                    }}>
                        <Icon name='cross' size='0_95x' />
                        <span className='btn-title'>{amPending ? tt('msgs_group_dropdown.cancel') : tt('msgs_group_dropdown.retire')}</span>
                    </button> : null}
                    {(amModer && pendings) ? <button className='button hollow alert' onClick={e => {
                        this.showGroupMembers(e, group, 'pending')
                    }} title={tt('group_members_jsx.check_pending_hint')}>
                        <Icon name='voters' size='0_95x' />
                        <span className='btn-title'>
                            {(isSmall ? '' : tt('group_members_jsx.check_pending')) + ' (' + pendings + ')'}
                        </span>
                    </button> : null}
                    <button className={cn('button', {
                        'force-white': !noMembers,
                        'icon-only': (isSmall || (amModer && pendings) || amPending),
                        hollow: noMembers,
                    })} onClick={e => {
                        this.showGroupMembers(e, group)
                    }} title={(isSmall || (amModer && pendings) || amPending) ? tt('my_groups_jsx.members') : null}>
                        <Icon name='voters' size='0_95x' />
                        <span className='btn-title'>{tt('my_groups_jsx.members')}</span>
                    </button>
                    {/*amOwner ? <button className='button hollow' onClick={e => {
                        this.showGroupSettings(e, group)
                    }}>
                        <Icon name='pencil' size='0_95x' />
                        <span className='btn-title'>{tt('my_groups_jsx.edit')}</span>
                    </button> : null*/}
                    {kebabItems.length ? <DropdownMenu el='div' items={kebabItems}>
                        <Icon name='new/more' size='0_95x' />
                    </DropdownMenu> : null}
                </td>
            </Link>
        </tr>
    }

    _renderTabs = () => {
        const { stat, } = this.props
        let { currentTab } = this.state
        currentTab = currentTab || stat.current
        let markRead = []
        let tabs = []
        for (const key of ['pending', 'member', 'moder', 'own']) {
            let counter = []
            if (key === 'member') {
                counter = ['group_member_mem']
            } else if (key === 'moder') {
                counter = ['join_request_mod', 'group_member_mod']
            } else if (key === 'own') {
                counter = ['join_request_own']
            }
            if (currentTab === key || !stat[key]) {
                markRead.push(counter)
            }
            if (!stat[key]) continue
            tabs.push(<div key={key} className={cn('label', { checked: (key === currentTab) })}
                onClick={e => {
                    this.setState({
                        currentTab: key
                    })
                }} >
                <span className='label-text'>
                    {tt('my_groups_jsx.tab_' + key) + ' (' + stat[key] + ')'}
                </span>
                {counter.length ? <NotifiCounter fields={counter.join(',')} /> : null}
            </div>)
        }
        if (tabs.length < 1) return { markRead, tabs: null }
        tabs = <div style={{ marginBottom: '0.5rem' }} title={tt('my_groups_jsx.tabs_title')}>
            {tabs}
        </div>
        return { markRead, tabs }
    }

    render() {
        let groups, hasGroups

        let { my_groups, username } = this.props

        if (!my_groups) {
            groups = <LoadingIndicator type='circle' />
        } else {
            my_groups = my_groups.toJS()

            let { tabs, markRead } = this._renderTabs()

            const reader = (username && markRead.length) ?
            <MarkNotificationRead delay={2500} interval={5000} fields={markRead.join(',')} account={username}
            /> : null

            if (!my_groups.length) {
                groups = <div>
                    {tabs}
                    {reader}
                    {tt('my_groups_jsx.empty')}
                    {tt('my_groups_jsx.empty2')}
                    <a href='#' onClick={this.showTopGroups}>
                        {tt('my_groups_jsx.find')}
                    </a>
                    {' ' + tt('my_groups_jsx.find2') + ' '}
                    {tt('g.or') + ' '}
                    <a href='#' onClick={this.createGroup}>
                        {tt('my_groups_jsx.create')}
                    </a>
                    {' ' + tt('my_groups_jsx.create2')}.
                </div>
            } else {
                hasGroups = true

                const { stat, } = this.props
                let { currentTab } = this.state
                currentTab = currentTab || stat.current

                groups = []
                for (const g of my_groups) {
                    if (currentTab && g.my_role !== currentTab) continue
                    groups.push(this._renderGroup(g))
                }

                groups = <React.Fragment>
                    {tabs}
                    {reader}
                    <table>
                        <tbody>
                            {groups}
                        </tbody>
                    </table>
                </React.Fragment>
            }
        }

        let button
        if (hasGroups) {
            const isSmall = isScreenSmall()
            button = <div>
                <button className='button hollow create-group' onClick={this.createGroup}>
                    {isSmall ? tt('my_groups_jsx.create_more2') : tt('my_groups_jsx.create_more')}
                </button>
                <button className='button hollow more-group' onClick={this.showTopGroups}>
                    <Icon name='search' />
                    <span className='btn-title'>{tt('my_groups_jsx.more_groups')}</span>
                </button>
            </div>
        }

        return <div className='MyGroups'>
               <div className='row'>
                   <h3>{tt('my_groups_jsx.title')}</h3>
               </div>
               {button}
               {groups}
               {hasGroups ? <div style={{ height: '50px' }}></div> : null}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const username = currentUser && currentUser.get('username')
        const my_groups = state.global.get('my_groups')
        const my_groups_stat = state.global.get('my_groups_stat')

        return { ...ownProps,
            currentUser,
            username,
            my_groups,
            stat: my_groups_stat ? my_groups_stat.toJS() : {},
        }
    },
    dispatch => ({
        fetchMyGroups: (currentUser) => {
            if (!currentUser) return
            const account = currentUser.get('username')
            dispatch(g.actions.fetchMyGroups({ account }))
        },
        showCreateGroup() {
            dispatch(user.actions.showCreateGroup({ redirectAfter: false }))
        },
        showTopGroups(account) {
            dispatch(user.actions.showTopGroups({ account }))
        },
        showGroupSettings({ group }) {
            dispatch(user.actions.showGroupSettings({ group }))
        },
        showGroupMembers({ group, current_tab }) {
            dispatch(user.actions.showGroupMembers({ group: ['my_groups', group], current_tab }))
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
        },
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
    })
)(MyGroups)
