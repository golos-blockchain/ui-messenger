import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'

import GroupCost from 'app/components/elements/groups/GroupCost'
import ExtLink from 'app/components/elements/ExtLink'

class GroupFinal extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    decorateSubmitError = (error) => {
        if (error && error.type === 'members') {
            return <React.Fragment>
                {tt('create_group_jsx.cannot_set_members')}<br/>
                {tt('create_group_jsx.cannot_set_members2')}<br/>
                <br/>
                {error.err}
            </React.Fragment>
        }
        if (error && error.startsWith && error.startsWith(tt('donate_jsx.insufficient_funds'))) {
            const { username } = this.props
            return <React.Fragment>
                {error}
                <ExtLink service='wallet' href={'/@' + username} target='_blank' rel='noopener noreferrer'>
                    <button type='button' style={{ marginLeft: '0.5rem', marginTop: '0rem', marginBottom: '0rem'}}
                        className='button small'>{tt('chain_errors.insufficient_top_up')}</button>
                </ExtLink>
            </React.Fragment>
        }
        return error
    }

    render() {
        let { group, submitError, cost } = this.props
        let moders = [], members = []
        if (group) {
            let allMembers = group.get('members')
            if (allMembers) {
                allMembers = allMembers.get('data').toJS()
                const makeLink = (pgm) => {
                    return <Link key={pgm.account} to={'/@' + pgm.account} target='_blank' rel='noopener noreferrer'>
                        {'@' + pgm.account}
                    </Link>
                }
                const addCommas = (arr) => {
                    return arr.reduce((list, elem, i) => {
                        const { key } = elem
                        list.push(elem)
                        if (i !== arr.length - 1) {
                            list.push(<span key={key + '-comma'}>,&nbsp;</span>)
                        }
                        return list
                    }, [])
                }
                for (const pgm of allMembers) {
                    if (pgm.member_type === 'moder') {
                        moders.push(makeLink(pgm))
                    } else {
                        members.push(makeLink(pgm))
                    }
                }
                moders = addCommas(moders)
                members = addCommas(members)
            }
        }
        return <React.Fragment>
            <div className='row' style={{ marginTop: '0rem' }}>
                <div className='column small-12' style={{paddingTop: 5, }}>
                    <span style={{ fontSize: '110%' }}>
                        {tt('create_group_jsx.final_desc')}
                    </span>
                    {moders.length ? <div style={{ marginTop: '0.75rem' }}>
                        {tt('create_group_jsx.moders_list')}&nbsp;{moders}
                    </div> : null}
                    {members.length ? <div style={{ marginTop: '0.75rem' }}>
                        {tt('create_group_jsx.members_list')}&nbsp;{members}
                    </div> : null}
                    {submitError ? <div className='error' style={{ marginTop: '0.5rem' }}>
                        {this.decorateSubmitError(submitError)}
                        </div> : null}
                </div>
            </div>

            <GroupCost cost={cost} />
        </React.Fragment>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const username = currentUser && currentUser.get('username')

        const { newGroup } = ownProps
        let currentGroup
        if (newGroup) {
            currentGroup = newGroup
        }
        const group = currentGroup && state.global.getIn(['groups', currentGroup.name])

        return {
            ...ownProps,
            username,
            group,
        }
    },
    dispatch => ({
    })
)(GroupFinal)
