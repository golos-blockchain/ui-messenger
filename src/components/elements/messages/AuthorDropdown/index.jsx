import React from 'react'
import {connect} from 'react-redux'
import { withRouter } from 'react-router'
import { Link } from 'react-router-dom'
import tt from 'counterpart'

class AuthorDropdown extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
        }
    }

    render() {
        const { author } = this.props
    	return <div>{author}</div>
    }
}

export default withRouter(connect(
    (state, ownProps) => {

        return {
        }
    },
    dispatch => ({
        deleteGroup: ({ owner, name, password, }) => {
        }
    }),
)(AuthorDropdown))
