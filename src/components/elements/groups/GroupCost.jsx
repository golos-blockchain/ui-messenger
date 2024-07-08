import React from 'react'
import tt from 'counterpart'

import Icon from 'app/components/elements/Icon'

export default class GroupCost extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    render() {
        let { cost, marginTop } = this.props
        if (!cost) {
            return null
        }
        marginTop = marginTop || '1.0rem'
        const isFree = cost.eq(0)
        const costTitle = isFree ? tt('create_group_jsx.create_of_group_is') : tt('create_group_jsx.gbg_too_low')
        const costStr = isFree ? tt('create_group_jsx.free') : cost.floatString
        return <div className='row' style={{ marginTop, marginBottom: '1.0rem' }}>
                <div className='column small-12'>
                    <b style={{ fontSize: '100%' }}>
                        <Icon name='editor/coin' size='1x' />
                        <span style={{ marginLeft: '0.35rem', verticalAlign: 'middle' }}>
                            {costTitle}
                            <span style={{ color: '#0078C4' }}>{costStr}</span>.
                        </span>
                    </b>
                </div>
        </div>
    }
}
