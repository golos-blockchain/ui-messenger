import React from 'react'
import { connect } from 'react-redux'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'

import ExtLink from 'app/components/elements/ExtLink'

class GroupFinal extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    decorateSubmitError = (error) => {
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
        const { submitError } = this.props
        return <React.Fragment>
            <div className='row' style={{ marginTop: '0rem', marginBottom: '2rem' }}>
                <div className='column small-12' style={{paddingTop: 5, }}>
                    <span style={{ fontSize: '110%' }}>
                        {tt('create_group_jsx.final_desc')}
                    </span>
                    {submitError ? <div className='error' style={{ marginTop: '0.5rem' }}>
                        {this.decorateSubmitError(submitError)}
                        </div> : null}
                </div>
            </div>
        </React.Fragment>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const username = currentUser && currentUser.get('username')

        return {
            ...ownProps,
            username,
        }
    },
    dispatch => ({
    })
)(GroupFinal)
