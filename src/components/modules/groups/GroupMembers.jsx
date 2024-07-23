import React from 'react'
import { connect } from 'react-redux'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'
import { validateAccountName } from 'golos-lib-js/lib/utils'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import AccountName from 'app/components/elements/common/AccountName'
import Input from 'app/components/elements/common/Input';
import GroupMember from 'app/components/elements/groups/GroupMember'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { getMemberType, getGroupMeta, getGroupTitle } from 'app/utils/groups'

export async function validateMembersStep(values, errors) {
    // nothing yet...
}

class GroupMembers extends React.Component {
    state = {}

    constructor(props) {
        super(props)
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

    init = () => {
        const { initialized } = this.state
        if (!initialized) {
            const { currentGroup } = this.props
            if (currentGroup) {
                const group = currentGroup
                this.props.fetchGroupMembers(group)
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
                        this.props.updateGroupMember(group, member, member_type)
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

    render() {
        const { currentGroup, group, username } = this.props
        const loading = this.isLoading()
        let members = group && group.get('members')
        if (members) members = members.get('data')
        if (members) members = members.toJS()

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

            // TODO: but we should check it in diff cases
            const { owner, member_list } = currentGroup
            const amOwner = currentGroup.owner === username
            const amModer = amOwner || (member_list && getMemberType(member_list, username) === 'moder')

            mems = <div>
                <div className='row' style={{ marginTop: '0.5rem', }}>
                    <div className='column small-12'>
                        <AccountName
                            placeholder={tt('create_group_jsx.add_member')}
                            onChange={this.onAddAccount}
                            filterAccounts={filterAccs}
                        />
                    </div>
                </div>
                <div className='row' style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                    <div className='column small-12'>
                        {mems}
                    </div>
                </div>
            </div>
        }

        let header
        const { creatingNew } = currentGroup
        if (creatingNew) {
            header = <div className='row' style={{ marginTop: '0rem' }}>
                <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                    {tt('create_group_jsx.members_desc')}
                </div>
            </div>
        } else {
            const { name, json_metadata } = currentGroup

            const meta = getGroupMeta(json_metadata)
            let title = getGroupTitle(meta, name)

            title = tt('group_members_jsx.title') + title + tt('group_members_jsx.title2')
            header = <div>
                <div className='row' style={{ marginTop: '0rem' }}>
                    <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                        <h4>{title}</h4>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '0rem' }}>
                    <div className='column small-12'>
                        <label style={{fontSize: '100%', display: 'inline-block'}} title={tt('group_members_jsx.check_pending_hint')}>
                            <input type='checkbox' />
                            {tt('group_members_jsx.check_pending')}
                        </label>
                        <label style={{fontSize: '100%', marginLeft: '1rem', display: 'inline-block'}}>
                            <input type='checkbox' />
                            {tt('group_members_jsx.check_banned')}
                        </label>
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
        let currentGroup
        if (newGroup) {
            currentGroup = newGroup
        } else {
            currentGroup = state.user.get('current_group')
            if (currentGroup) currentGroup = currentGroup.toJS()
        }
        const group = currentGroup && state.global.getIn(['groups', currentGroup.name])
        return {
            ...ownProps,
            username,
            currentGroup,
            group,
        }
    },
    dispatch => ({
        fetchGroupMembers: (group) => {
            dispatch(g.actions.fetchGroupMembers({
                group: group.name, creatingNew: !!group.creatingNew }))
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
