import React from 'react'

class BackButtonController extends React.Component {
    componentDidMount() {
        if (!process.env.MOBILE_APP) {
            console.error('BackButtonController used without MOBILE_APP')
            return
        }
        document.addEventListener('deviceready', this.init, false)
    }

    componentWillUnmount() {
        document.removeEventListener('deviceready', this.init)
        document.removeEventListener('backbutton', this.handle)
    }

    init = () => {
        document.addEventListener('backbutton', this.handle, false)
    }

    handle = (e) => {
        if (this.props.handle) {
            e.preventDefault()
            this.props.handle()
        } else if (this.props.goHome) {
            e.preventDefault()
            navigator.Backbutton.goHome()
        } else {
            navigator.app.backHistory()
        }
    }

    render() {
        return null
    }
}

export default BackButtonController
