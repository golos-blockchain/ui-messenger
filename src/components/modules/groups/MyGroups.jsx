import React from 'react'
import {connect} from 'react-redux'
import { Link } from 'react-router-dom'
import { Map } from 'immutable'
import { api, formatter } from 'golos-lib-js'
import tt from 'counterpart'

import DialogManager from 'app/components/elements/common/DialogManager'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { showLoginDialog } from 'app/components/dialogs/LoginDialog'
import { getGroupLogo, getGroupMeta, getRoleInGroup } from 'app/utils/groups'

class MyGroups extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loaded: false
        }
    }

    refetch = () => {
        const { currentUser } = this.props
        this.props.fetchMyGroups(currentUser)
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

        const logo = getGroupLogo(json_metadata)
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

    showGroupMembers = (e, group, show_pendings) => {
        e.preventDefault()
        const { name } = group
        this.props.showGroupMembers({ group: name, show_pendings })
    }

    onGoGroup = (e) => {
        const { closeMe } = this.props
        if (closeMe) closeMe()
    }

    _renderGroup = (group) => {
        const { name, json_metadata, pendings } = group

        const meta = getGroupMeta(json_metadata)

        let title = meta.title || name
        let titleShr = title
        if (titleShr.length > 20) {
            titleShr = titleShr.substring(0, 17) + '...'
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
        if (amMember || (amModer && !amOwner)) {
            kebabItems.push({ link: '#', onClick: e => {
                this.retireCancel(e, group, titleShr, amPending)
            }, value: tt('msgs_group_dropdown.retire') })
        }

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
                    {amPending ? <button className='button hollow alert' title={
                        amPending ? tt('msgs_group_dropdown.pending') : null} onClick={e => {
                        this.retireCancel(e, group, titleShr, amPending)
                    }}>
                        <Icon name='cross' size='0_95x' />
                        <span className='btn-title'>{amPending ? tt('msgs_group_dropdown.cancel') : tt('msgs_group_dropdown.retire')}</span>
                    </button> : null}
                    {(amModer && pendings) ? <button className='button hollow' onClick={e => {
                        this.showGroupMembers(e, group, true)
                    }} title={tt('group_members_jsx.check_pending_hint')}>
                        <Icon name='voters' size='0_95x' />
                        <span className='btn-title'>{tt('group_members_jsx.check_pending') + ' (' + pendings + ')'}</span>
                    </button> : null}
                    <button className='button' onClick={e => {
                        this.showGroupMembers(e, group)
                    }}>
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

    render() {
        let groups, hasGroups

        let { my_groups } = this.props

        if (!my_groups) {
            groups = <LoadingIndicator type='circle' />
        } else {
            my_groups = my_groups.toJS()

            if (!my_groups.length) {
                groups = <div>
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
                groups = []
                for (const g of my_groups) {
                    groups.push(this._renderGroup(g))
                }
                groups = <table>
                    <tbody>
                        {groups}
                    </tbody>
                </table>
            }
        }

        let button
        if (hasGroups) {
            button = <div>
                <button className='button hollow create-group' onClick={this.createGroup}>
                    {tt('my_groups_jsx.create_more')}
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

        return { ...ownProps,
            currentUser,
            username,
            my_groups,
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
        showGroupMembers({ group, show_pendings }) {
            dispatch(user.actions.showGroupMembers({ group: ['my_groups', group], show_pendings }))
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
