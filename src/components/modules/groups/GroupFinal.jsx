import React from 'react'
import { connect } from 'react-redux'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'

class GroupFinal extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    render() {
        return <React.Fragment>
            <div className='row' style={{ marginTop: '0rem', marginBottom: '2rem' }}>
                <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                    {tt('create_group_jsx.final_desc')}
                </div>
            </div>
        </React.Fragment>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
    },
    dispatch => ({
    })
)(GroupFinal)
