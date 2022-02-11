import React from 'react'
import { connect } from 'react-redux'

class Themifier extends React.Component {
    componentDidMount() {
        this.toggleBodyNightmode()
    }

    componentDidUpdate(prevProps) {
        this.toggleBodyNightmode()
    }

    toggleBodyNightmode() {
        const { nightmodeEnabled } = this.props
        if (nightmodeEnabled) {
            document.body.classList.remove('theme-light')
            document.body.classList.add('theme-dark')
        } else {
            document.body.classList.remove('theme-dark')
            document.body.classList.add('theme-light')
        }
    }

    render() {
        const { nightmodeEnabled } = this.props
        const theme = nightmodeEnabled ? 'theme-dark' : 'theme-light'
        return (
            <div className={'App no-header ' + theme}>
                {this.props.children}
            </div>
        );
    }
}

export default connect(
    (state, ownProps) => {
        const nightmodeEnabled = state.user.get('nightmodeEnabled')
        return {
            nightmodeEnabled
        }
    }
)(Themifier)
