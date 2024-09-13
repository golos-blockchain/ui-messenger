import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import transaction from 'app/redux/TransactionReducer'
import { getRoleInGroup } from 'app/utils/groups'
import { maxDateStr, isBlockedByMe, isBlockingMe } from 'app/utils/misc'

class StubInner extends React.Component {
    onBtnClick = (e) => {
        e.preventDefault()
        const { username, group, pending } = this.props
        this.props.groupMember({
            requester: username, group: group.name,
            member: username,
            member_type: pending ? 'retired' : 'pending',
            onSuccess: () => {
            },
            onError: (err, errStr) => {
                alert(errStr)
            }
        })
    }

    render() {
        const { type, banned, notMember, pending, loading, blocked, blocking } = this.props

        const isCompose = type === 'compose'

        let text, btn
        if (banned) {
            text = tt('stub_jsx.banned')
        } else if (pending) {
            text = tt('stub_jsx.pending')
            text += ' '
            btn = <a href='#' className='stub-btn alert' onClick={this.onBtnClick}>{tt('msgs_group_dropdown.cancel')}</a>
        } else if (notMember) {
            text = isCompose ? tt('stub_jsx.read_only') : tt('stub_jsx.private_group')
            text += ' '
            btn = <a href='#' className='stub-btn' onClick={this.onBtnClick}>{tt('stub_jsx.join')}</a>
        } else if (blocked) {
            text = tt('stub_jsx.blocked')
        } else if (blocking) {
            text = tt('stub_jsx.blocking')
        }

        if (isCompose) {
            return <div className='msgs-compose-input compose-stub'>
                {text}{btn}
            </div>
        } else {
            if (loading) {
                return <div className='msgs-stub'>
                    <center>
                        <LoadingIndicator type='circle' size='3rem' />
                    </center>
                </div>
            }
            return <div className='msgs-stub'>
                <center>
                    {text}{btn}
                </center>
            </div>
        }
    }
}

const Stub = connect(
    (state, ownProps) => {
        const currentUser = state.user.get('current')

        const username = state.user.getIn(['current', 'username'])

        let the_group = state.global.get('the_group')
        if (the_group && the_group.toJS) the_group = the_group.toJS()

        return {
            the_group,
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
    }),
)(StubInner)

export default Stub

export const renderStubs = (the_group, to, username, accounts) => {
    let composeStub, msgsStub

    const isGroup = to && !to.startsWith('@')
    if (to && !isGroup) {
        const acc = accounts[to.replace('@', '')]
        if (isBlockingMe(acc)) {
            composeStub = { ui: <Stub type='compose' blocked={true} /> }
            return { composeStub, msgsStub}
        }
        if (isBlockedByMe(acc)) {
            composeStub = { ui: <Stub type='compose' blocking={true} /> }
            return { composeStub, msgsStub}
        }
    }

    if (!the_group || the_group.error) {
        if (isGroup) {
            composeStub = { disabled: true }
            if (the_group !== null) { // if not 404
                msgsStub = { ui: <Stub type='messages' loading /> }
            }
        }
        return { composeStub, msgsStub}
    }
    if (the_group.name !== to) {
        return { composeStub, msgsStub}
    }

    const { privacy } = the_group
    const { amBanned, amMember, amModer, amPending } = getRoleInGroup(the_group, username)
    const notMember = !amModer && !amMember
    if (amBanned || (privacy !== 'public_group' && notMember)) {
        composeStub = { ui: <Stub type='compose' banned={amBanned} notMember={notMember}
            pending={amPending} group={the_group} /> }
        if (privacy === 'private_group') {
            composeStub = { disabled: true }
            msgsStub = { ui: <Stub type='messages' banned={amBanned} notMember={notMember}
                pending={amPending} group={the_group} /> }
        }
    }

    return { composeStub, msgsStub}
}
