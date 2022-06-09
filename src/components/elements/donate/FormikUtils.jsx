import React from 'react'

import { AssetEditor } from 'golos-lib-js/lib/utils'

class FormikAgent extends React.Component {
    setVals = (username) => {
        const { setFieldValue, opts } = this.props
        const { sym, precision } = opts
        setFieldValue('amount', AssetEditor(0, precision, sym))
    }

    componentDidMount() {
        const { setFieldValue, currentUser, opts } = this.props
        if (currentUser) {
            const username = currentUser.get('username')
            this.setVals(username)
        }
    }

    componentDidUpdate(prevProps) {
        const { setFieldValue, currentUser, opts } = this.props
        const { sym, precision } = opts
        if (currentUser && (!prevProps.currentUser || sym !== prevProps.opts.sym)) {
            const username = currentUser.get('username')
            this.setVals(username)
        }
    }

    render() { return null }
}

export default FormikAgent
