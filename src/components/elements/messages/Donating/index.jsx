import React from 'react';
import tt from 'counterpart';
import {connect} from 'react-redux'
import { Asset } from 'golos-lib-js/lib/utils'

import Icon from 'app/components/elements/Icon'
import user from 'app/redux/UserReducer'
import './index.css'

class Donating extends React.Component {
    state = {
        animating: false
    }

    componentDidUpdate(prevProps) {
        const { donates, donates_uia } = this.props.data
        if (donates !== prevProps.data.donates
            || donates_uia !== prevProps.data.donates_uia) {
            this.animate()
        }
    }

    animate = () => {
        this.setState({
            animating: true
        })
        setTimeout(() => {
            this.setState({
                animating: false
            })
        }, 2500)
    }

    onClick = e => {
        const { isMine } = this.props
        if (!isMine) {
            const { from, to, nonce } = this.props.data
            this.props.showDonate(from, to, nonce)
        }
    }

    render() {
        const { isMine } = this.props
        let { donates, donates_uia } = this.props.data
        donates = Asset(donates)

        let some = ''
        let someTitle = ''
        if (donates.amount) {
            const str = donates.toString(0)
            some += str.split(' ')[0]
            someTitle += str
        }
        if (donates_uia) {
            some += (some ? '+' : '') + donates_uia
            someTitle += (someTitle ? ' + ' : '') + donates_uia + ' UIA'
        }

        const { animating } = this.state

        return <div className={'msgs-donating' + (some ? ' some' : '') + (animating ? ' animating' : '')}>
            <div onClick={this.onClick} title={isMine ? tt('donating_jsx.reward') : tt('donating_jsx.title')}>
                <Icon name='ionicons/gift'></Icon>
                {some ? <span title={someTitle} className='msgs-some'>{some}</span> : null}
            </div>
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        return { ...ownProps }
    },
    dispatch => ({
        showDonate(from, to, nonce) {
            dispatch(user.actions.setDonateDefaults({
                from, to, nonce,
                sym: 'GOLOS',
                precision: 3,
            }))
            dispatch(user.actions.showDonate())
        },
    })
)(Donating)
