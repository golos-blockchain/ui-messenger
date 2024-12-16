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
            currentTab: props.current_tab || 'member',
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
            const { currentGroup, username } = this.props
            if (currentGroup) {
                const group = currentGroup

                let { amModer } = getRoleInGroup(group, username)

                const memberTypes = []
                const sortConditions = []
                const { currentTab } = this.state
                if (!amModer && currentTab === 'member') {
                    memberTypes.push('moder')
                    memberTypes.push('member')
                } else if (currentTab) {
                    memberTypes.push(currentTab)
                }
                // sortConditions.push({
                //     member_type: 'banned',
                //     direction: 'up'
                // })

                this.props.fetchGroupMembers(group, memberTypes, sortConditions)
                this.setState({
                    initialized: true
                })
            }
        }
    }

    onAddAccount = (e) => {
        try {
            const { value } = e.target
            const member = value
            const { currentTab } = this.state
            const member_type = currentTab

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

    _renderMemberTypeSwitch = (amModer, ownerRight) => {
        const { currentGroup, } = this.props
        const { moders, members, } = currentGroup
        const { currentTab } = this.state
        const disabled = !amModer && !moders
        let tabs = []

        let memTypes = ['member', 'moder']
        if (amModer) {
            memTypes.unshift('pending')
            memTypes.push('banned')
        }
        for (const key of memTypes) {
            let title
            if (!amModer && key === 'member') {
                title = tt('group_members_jsx.all') + ' (' + (moders + members) + ')'
            } else {
                title = tt('group_members_jsx.' + key + 's') + ' (' + (currentGroup[key + 's']) + ')'
            }
            tabs.push(<div key={key} className={cn('label', { checked: (currentTab === key), disabled })} onClick={!disabled ? (e) => {
                this.setState({
                    currentTab: key
                }, () => {
                    this.init(true)
                })
            } : undefined}>
                {title}
            </div>)
        }
        return <div>
            {tabs}
            {ownerRight}
        </div>
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

            const isEmpty = !mems.length
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

            const { currentTab } = this.state

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
                            isDisabled={currentTab === 'pending'}
                        />
                    </div>
                </div> : null}
                <div className='row' style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                    <div className='column small-12'>
                        {!isEmpty ? mems : <div style={{ textAlign: 'center', paddingTop: '1rem' }}>
                            {tt('group_members_jsx.empty')}</div>}
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
                <div className='row' style={{ marginTop: '0rem', marginBottom: '0.5rem' }}>
                    <div className='column small-12'>
                        {this._renderMemberTypeSwitch(amModer, ownerRight)}
                    </div>
                </div>
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
        let currentGroup, current_tab
        if (newGroup) {
            currentGroup = newGroup
        } else {
            const options = state.user.get('group_members_modal')
            if (options) {
                currentGroup = options.get('group')
                current_tab = options.get('current_tab')
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
            current_tab,
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
