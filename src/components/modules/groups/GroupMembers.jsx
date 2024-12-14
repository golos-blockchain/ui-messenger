import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'
import { validateAccountName } from 'golos-lib-js/lib/utils'
import cn from 'classnames'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import AccountName from 'app/components/elements/common/AccountName'
import Input from 'app/components/elements/common/Input';
import GroupMember from 'app/components/elements/groups/GroupMember'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { getRoleInGroup, getGroupMeta, getGroupTitle } from 'app/utils/groups'
import isScreenSmall from 'app/utils/isScreenSmall'

export async function validateMembersStep(values, errors) {
    // nothing yet...
}

class GroupMembers extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            showModers: false,
            showPendings: !!props.showPendings,
        }
    }

    componentDidMount() {
        this.init()
    }

    componentDidUpdate() {
        this.init()
    }

    isLoading = () => {
        const { group } = this.props
        if (!group) return true
        const members = group.get('members')
        if (!members) return true
        return members.get('loading')
    }

    init = (force = false) => {
        const { initialized } = this.state
        if (!initialized || force) {
            const { currentGroup } = this.props
            if (currentGroup) {
                const group = currentGroup

                const memberTypes = ['moder']
                const sortConditions = []
                const { showPendings, showBanneds, showModers } = this.state
                if (!showModers) memberTypes.push('member')
                if (showPendings) {
                    memberTypes.push('pending')
                    sortConditions.push({
                        member_type: 'pending',
                        direction: 'up'
                    })
                }
                if (showBanneds) {
                    memberTypes.push('banned')
                    sortConditions.push({
                        member_type: 'banned',
                        direction: 'up'
                    })
                }

                this.props.fetchGroupMembers(group, memberTypes, sortConditions)
                this.setState({
                    initialized: true
                })
            }
        }
    }

    toggleModers = (e) => {
        this.setState({
            showModers: !this.state.showModers
        }, () => {
            this.init(true)
        })
    }

    togglePendings = (e) => {
        const { checked } = e.target
        this.setState({
            showPendings: checked
        }, () => {
            this.init(true)
        })
    }

    toggleBanneds = (e) => {
        const { checked } = e.target
        this.setState({
            showBanneds: checked
        }, () => {
            this.init(true)
        })
    }

    onAddAccount = (e) => {
        try {
            const { value } = e.target
            const member = value
            const member_type = 'member'

            const { username, currentGroup } = this.props
            const { creatingNew } = currentGroup
            const group = currentGroup.name

            if (creatingNew) {
                this.props.updateGroupMember(group, member, member_type)
            } else {
                this.props.groupMember({
                    requester: username, group,
                    member,
                    member_type,
                    onSuccess: () => {
                    },
                    onError: (err, errStr) => {
                        alert(errStr)
                    }
                })
            }
        } catch (err) { // TODO: and it is not enough :) if error in groupMember
            console.error(err)
        }
    }

    _renderMemberTypeSwitch = () => {
        const { currentGroup, } = this.props
        const { moders, members, } = currentGroup
        const { showModers } = this.state
        const disabled = !moders
        return <React.Fragment>
            <div className={cn('label', { checked: !showModers, disabled })} onClick={!disabled && this.toggleModers}>
                {tt('group_members_jsx.all') + ' (' + (moders + members) + ')'}
            </div>
            <span style={{ width: '0.5rem', display: 'inline-block' }}></span>
            <div className={cn('label moders', { checked: showModers, disabled })} onClick={!disabled && this.toggleModers}>
                {tt('group_members_jsx.moders') + ' (' + moders + ')'}
            </div>
        </React.Fragment>
    }

    render() {
        const { currentGroup, group, username, closeMe } = this.props
        const loading = this.isLoading()
        let members = group && group.get('members')
        if (members) members = members.get('data')
        if (members) members = members.toJS()

        const { creatingNew } = currentGroup
        let { amOwner, amModer } = getRoleInGroup(currentGroup, username)
        if (creatingNew) {
            amOwner = true
            amModer = true
        }

        const isSmall = isScreenSmall()

        const linkClick = () => {
            if (closeMe) closeMe()
        }

        let mems
        if (loading) {
            mems = <div>
                <div className='row' style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                    <div className='column small-12'>
                        <LoadingIndicator type='circle' />
                    </div>
                </div>
            </div>
        } else {
            mems = []
            for (const member of members) {
                const { groupMember, updateGroupMember } = this.props
                mems.push(<GroupMember key={member.account} member={member}
                    username={username} currentGroup={currentGroup}
                    groupMember={groupMember} updateGroupMember={updateGroupMember}
                    linkClick={linkClick}
                />)
            }

            mems = <table>
                <tbody>
                    {mems}
                </tbody>
            </table>

            const filterAccs = new Set()
            if (username) filterAccs.add(username)
            for (const m of members) {
                filterAccs.add(m.account)
            }

            mems = <div>
                {amModer ? <div className='row' style={{ marginTop: '0.5rem', }}>
                    <div className='column small-12'>
                        <AccountName
                            placeholder={isSmall ? tt('create_group_jsx.add_member2') : tt('create_group_jsx.add_member')}
                            onChange={this.onAddAccount}
                            filterAccounts={filterAccs}
                            onAccountsLoad={(accs) => {
                                this.props.receiveAccounts(accs)
                            }}
                        />
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                    <div className='column small-12'>
                        {mems}
                    </div>
                </div>
            </div>
        }

        let header
        if (creatingNew) {
            header = <div className='row' style={{ marginTop: '0rem' }}>
                <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                    {tt('create_group_jsx.members_desc')}
                </div>
            </div>
        } else {
            const { name, owner, json_metadata, pendings, banneds, } = currentGroup

            const meta = getGroupMeta(json_metadata)
            let title = getGroupTitle(meta, name)

            title = tt('group_members_jsx.title') + title + tt('group_members_jsx.title2')

            const { showPendings, showBanneds } = this.state

            let ownerRight, ownerRow
            let ownerBlock = <React.Fragment>
                {tt('group_settings_jsx.owner') + ' - '}
                {amOwner ? <b title={'@' + owner}>{tt('g.you')}</b> :
                    <Link to={'/@' + owner} onClick={linkClick}>{('@' + owner)}</Link>}
            </React.Fragment>
            if (isSmall) {
                ownerRow = <div className='row' style={{ marginTop: '0rem', marginBottom: '0.5rem' }}>
                    <div className='column small-12'>
                        {ownerBlock}
                    </div>
                </div>
            } else {
                ownerRight = <div style={{ float: 'right', }}>
                    {ownerBlock}
                </div>
            }

            header = <div>
                <div className='row' style={{ marginTop: '0rem' }}>
                    <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                        <h4>{title}</h4>
                    </div>
                </div>
                {ownerRow}
                {amModer ? <div className='row' style={{ marginTop: '0rem' }}>
                    <div className='column small-12'>
                        <label style={{fontSize: '100%', display: 'inline-block'}} title={tt('group_members_jsx.check_pending_hint')}>
                            <input type='checkbox' disabled={!pendings} checked={!!showPendings} onChange={this.togglePendings} />
                            {tt('group_members_jsx.check_pending') + ' (' + pendings + ')'}
                        </label>
                        <span style={{ width: '1rem', display: 'inline-block' }}></span>
                        <label style={{fontSize: '100%', display: 'inline-block'}}>
                            <input type='checkbox' disabled={!banneds} checked={!!showBanneds} onChange={this.toggleBanneds} />
                            {tt('group_members_jsx.check_banned') + ' (' + banneds + ')'}
                        </label>
                        {ownerRight}
                    </div>
                </div> : <div className='row' style={{ marginTop: '0rem', marginBottom: '0.5rem' }}>
                    <div className='column small-12'>
                        {this._renderMemberTypeSwitch()}
                        {ownerRight}
                    </div>
                </div>}
            </div>
        }

        return <div className='GroupMembers' style={{ minHeight: '300px' }}>
            {header}
            {mems}
        </div>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.get('current')
        const username = currentUser && currentUser.get('username')

        const { newGroup } = ownProps
        let currentGroup, showPendings
        if (newGroup) {
            currentGroup = newGroup
        } else {
            const options = state.user.get('group_members_modal')
            if (options) {
                currentGroup = options.get('group')
                showPendings = options.get('show_pendings')
            }
            if (currentGroup) {
                const [ path, name ] = currentGroup
                if (path === 'the_group') {
                    currentGroup = state.global.get('the_group')
                } else {
                    currentGroup = state.global.get('my_groups').find(g => g.get('name') === name)
                }
                if (currentGroup) currentGroup = currentGroup.toJS()
            }
        }
        const group = currentGroup && state.global.getIn(['groups', currentGroup.name])
        return {
            ...ownProps,
            username,
            currentGroup,
            group,
            showPendings,
        }
    },
    dispatch => ({
        fetchGroupMembers: (group, memberTypes, sortConditions) => {
            dispatch(g.actions.fetchGroupMembers({
                group: group.name, creatingNew: !!group.creatingNew, memberTypes, sortConditions, }))
        },
        receiveAccounts: (accs) => {
            for (const acc of accs) {
                dispatch(g.actions.receiveAccount({ account: acc }))
            }
        },
        updateGroupMember: (group, member, member_type) => {
            dispatch(g.actions.updateGroupMember({
                group, member, member_type, }))
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
        }
    })
)(GroupMembers)
