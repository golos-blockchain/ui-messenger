import React from 'react'
import { connect } from 'react-redux'
import { Link } from 'react-router-dom'

import g from './redux/GlobalReducer'

class Messages extends React.Component {
    test1 = () => {
        this.props.test1()
    }
    render() {
        return (
            <div>
                <div>1</div>
                <div>{this.props.tick0}</div>
                <div>{JSON.stringify(g)}</div>
                <button onClick={this.test1}>test1</button>
                <Link to='/msgs/@lex'>/msgs/@lex</Link>
            </div>
        )
    }
}

export default connect(
    (state, ownProps) => {
        return {
            tick0: state.global.get('tick')
        }
    },
    dispatch => ({
        test1: () => {
            dispatch(g.actions.tick())
        },
    }),
)(Messages)
