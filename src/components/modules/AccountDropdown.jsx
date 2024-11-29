import React from 'react'
import { connect } from 'react-redux'
import tt from 'counterpart'

import DialogManager from 'app/components/elements/common/DialogManager'
import VerticalMenu from 'app/components/elements/VerticalMenu'
import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import { maxDateStr, isBlockedByMe } from 'app/utils/misc'

class AccountDropdown extends React.Component {
    constructor(props) {
        super(props)
    }

    block = (e, block = true) => {
        e.preventDefault()
        const { username, toAcc } = this.props
        this.props.updateBlock({ blocker: username, blocking: toAcc, block,
            onError: (err, errStr) => {
                alert(errStr)
            }
        })
    }

    clearAll = async (e, delete_contact = false) => {
        e.preventDefault()

        const { username, messages, toAcc } = this.props
        const conf = delete_contact ?
            (messages.length ? tt('account_dropdown_jsx.are_you_sure_delete') :
            tt('account_dropdown_jsx.are_you_sure_delete_empty')) :
            tt('account_dropdown_jsx.are_you_sure')
        const res = await DialogManager.dangerConfirm(<div>
            {conf}<b>@{toAcc}</b>?</div>,
            'GOLOS Messenger')
        if (!res) return

        this.props.clearAll({ from: username, to: toAcc, delete_contact,
            onError: (err, errStr) => {
                alert(errStr)
            }
        })
    }

    render() {
        const { messages, contacts, accounts, toAcc } = this.props
        let menuItems = [
            {link: '/@' + toAcc, extLink: 'blogs', label: <b>{'@' + toAcc}</b>, value: toAcc },
        ]

        const acc = accounts[toAcc]
        const blocking = isBlockedByMe(acc)
        menuItems.push({link: '#', onClick: e => this.block(e, !blocking), icon: 'ionicons/ban', value: blocking ? tt('g.unblock') : tt('g.block') },)

        if (messages.length) {
            menuItems.push({link: '#', onClick: e => this.clearAll(e), icon: 'clock', value: tt('account_dropdown_jsx.clear_history') })
        }

        const hasContact = contacts.filter(c => c.contact === toAcc && c.kind === 'account').length
        if (hasContact) {
            menuItems.push({link: '#', onClick: e => this.clearAll(e, true), icon: 'ionicons/trash-outline', value: 'clear_all', label: tt('account_dropdown_jsx.delete_chat') },)
        }

        return <VerticalMenu
            items={menuItems} />
    }
}

export default connect(
    (state, ownProps) => {
        const username = state.user.getIn(['current', 'username'])
        const messages = state.global.get('messages')
        const contacts = state.global.get('contacts')
        const accounts = state.global.get('accounts')
        return {
            username,
            messages: messages ? messages.toJS() : [],
            contacts: contacts ? contacts.toJS() : [],
            accounts: accounts ? accounts.toJS() : {},
        }
    },
    dispatch => ({
        updateBlock: ({ blocker, blocking, block, onError }) => {
            dispatch(transaction.actions.broadcastOperation({
                type: 'account_setup',
                operation: {
                    account: blocker,
                    settings: [
                        [0, {
                            account: blocking,
                            block
                        }]
                    ],
                    extensions: []
                },
                successCallback: () => {
                    dispatch(g.actions.updateBlocking({ blocker, blocking, block }))
                },
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }))
        },
        clearAll: ({ from, to, delete_contact, onError }) => {
            const newest_date = maxDateStr()
            const json = JSON.stringify(['private_delete_message', {
                requester: from,
                from,
                to,
                start_date: '1970-01-01T00:00:00',
                stop_date: newest_date,
                nonce: 0,
                extensions: [[1, {
                    delete_contact
                }]]
            }])
            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                operation: {
                    id: 'private_message',
                    required_posting_auths: [from],
                    json,
                },
                successCallback: null,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }))
        }
    }),
)(AccountDropdown)
