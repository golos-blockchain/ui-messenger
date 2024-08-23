import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'
import user from 'app/redux/UserReducer'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { getGroupLogo, getGroupMeta, } from 'app/utils/groups'

class TopGroups extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    refetch = () => {
        const { currentUser } = this.props
        this.props.fetchTopGroups(currentUser)
    }

    componentDidMount = async () => {
        this.refetch()
    }

    createGroup = (e) => {
        e.preventDefault()
        this.props.hideTopGroups()
        this.props.showCreateGroup()
    }

    _renderGroupLogo = (group, meta) => {
        const { json_metadata } = group

        const logo = getGroupLogo(json_metadata)
        return <td className='group-logo'>
            <img src={logo} title={meta.title || name} />
        </td>
    }

    onGoGroup = (e) => {
        const { hideMyGroups, closeMe } = this.props
        hideMyGroups()
        if (closeMe) closeMe()
    }

    _renderGroup = (group) => {
        const { name, json_metadata, members, moders, total_messages,
            privacy, is_encrypted } = group

        const meta = getGroupMeta(json_metadata)

        let title = meta.title || name
        let titleShr = title
        if (titleShr.length > 16) {
            titleShr = titleShr.substring(0, 13) + '...'
        }

        const { username } = this.props

        const totalMembers = members + moders

        let groupType
        if (privacy === 'public_group') {
            groupType = tt('top_groups_jsx.public')
        } else {
            groupType = tt('top_groups_jsx.private')
        }
        groupType = <div className='group-type'>{groupType}</div>

        const lock = <Icon size='0_5x'
            title={is_encrypted ? tt('msgs_group_dropdown.encrypted') : tt('msgs_group_dropdown.not_encrypted')}
            name={is_encrypted ? 'ionicons/lock-closed-outline' : 'ionicons/lock-open-outline'} />

        return <tr key={name}>
            <Link to={'/' + name} onClick={this.onGoGroup}>
                {this._renderGroupLogo(group, meta)}
                <td title={title} className='group-title'>
                    {titleShr}
                </td>
                <td className='group-stats'>
                    {tt('plurals.member_count', {
                        count: totalMembers
                    })}<br/>
                    {tt('plurals.message_count', {
                        count: total_messages
                    })}
                </td>
                <td className='group-privacey'>
                    {groupType}<br/>{lock}
                </td>
            </Link>
        </tr>
    }

    render() {
        let groups, hasGroups

        let { top_groups } = this.props

        if (!top_groups) {
            groups = <LoadingIndicator type='circle' />
        } else {
            top_groups = top_groups.toJS()

            if (!top_groups.length) {
                groups = <div>
                    {tt('top_groups_jsx.empty')}
                    {tt('top_groups_jsx.empty2')}
                    <a href='#' onClick={this.createGroup}>
                        {tt('top_groups_jsx.create')}
                    </a>
                </div>
            } else {
                hasGroups = true
                groups = []
                for (const g of top_groups) {
                    groups.push(this._renderGroup(g))
                }
                groups = <table>
                    <tbody>
                        {groups}
                    </tbody>
                </table>
            }
        }

        return <div className='TopGroups'>
               <div className='row'>
                   <h3>{tt('top_groups_jsx.title')}</h3>
               </div>
               {groups}
               {hasGroups ? <div style={{ height: '50px' }}></div> : null}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const username = currentUser && currentUser.get('username')
        const top_groups = state.global.get('top_groups')

        return { ...ownProps,
            currentUser,
            username,
            top_groups,
        }
    },
    dispatch => ({
        fetchTopGroups: (currentUser) => {
            if (!currentUser) return
            const account = currentUser.get('username')
            dispatch(g.actions.fetchTopGroups({ account }))
        },
        hideMyGroups: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideMyGroups())
        },
        hideTopGroups: e => {
            if (e) e.preventDefault()
            dispatch(user.actions.hideTopGroups())
        },
        showCreateGroup() {
            dispatch(user.actions.showCreateGroup({ redirectAfter: false }))
        },
    })
)(TopGroups)
