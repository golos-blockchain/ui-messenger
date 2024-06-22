import React from 'react'
import {connect} from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { api, formatter } from 'golos-lib-js'
import { Asset, Price, AssetEditor } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import { session } from 'app/redux/UserSaga'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import FormikAgent from 'app/components/elements/donate/FormikUtils'
import DialogManager from 'app/components/elements/common/DialogManager'
import { showLoginDialog } from 'app/components/dialogs/LoginDialog'
import { getGroupLogo, getGroupMeta } from 'app/utils/groups'

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

    _renderGroup = (group) => {
        const { name, json_metadata } = group

        const meta = getGroupMeta(json_metadata)

        let title = meta.title || name
        let titleShr = title
        if (titleShr.length > 20) {
            titleShr = titleShr.substring(0, 17) + '...'
        }

        const kebabItems = []

        kebabItems.push({ link: '#', onClick: e => {
            this.deleteGroup(e, group, titleShr)
        }, value: tt('g.delete') })

        return <tr key={name}>
            <a href={'/' + name} target='_blank' rel='noreferrer nofollow'>
                {this._renderGroupLogo(group, meta)}
                <td title={title} className='group-title'>
                    {titleShr}
                </td>
                <td className='group-buttons' onClick={(e) => {
                    e.preventDefault()
                }}>
                    <button className='button hollow'>
                        {tt('my_groups_jsx.edit')}
                    </button>
                    <button className='button hollow alert'>
                        {tt('g.delete')}
                    </button>
                    {kebabItems.length ? <DropdownMenu el='div' items={kebabItems}>
                        <Icon name='new/more' size='0_95x' />
                    </DropdownMenu> : null}
                </td>
            </a>
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
                    <a href='#' onClick={this.createGroup}>
                        {tt('my_groups_jsx.create')}
                    </a>
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
            button = <button className='button' onClick={this.createGroup}>
                {tt('my_groups_jsx.create_more')}
            </button>
        }

        return <div className='MyGroups'>
               <div className='row'>
                   <h3>{tt('my_groups_jsx.title')}</h3>
               </div>
               {button}
               {groups}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])
        const my_groups = state.global.get('my_groups')

        return { ...ownProps,
            currentUser,
            currentAccount,
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
                password,
                successCallback: onSuccess,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }));
        }
    })
)(MyGroups)
