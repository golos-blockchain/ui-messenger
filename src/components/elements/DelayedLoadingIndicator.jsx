import React from 'react'

import LoadingIndicator from 'app/components/elements/LoadingIndicator'

class DelayedLoadingIndicator extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            shown: false
        }
    }

    componentDidMount() {
        let { delay } = this.props
        delay = delay || 0
        this.timer = setTimeout(() => {
            this.setState({
                shown: true
            })
        }, delay)
    }

    componentWillUnmount() {
        if (this.timer) {
            clearTimeout(this.timer)
            this.timer = null
        }
    }

    render() {
        const { delay, ...restProps } = this.props
        if (!this.state.shown) {
            return null
        }
        return <LoadingIndicator {...restProps} />
    }
}

export default DelayedLoadingIndicator
