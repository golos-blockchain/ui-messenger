import React from 'react'

import tt from 'counterpart'

class RenderError extends React.Component {
    refreshIt = () => {
        if (window.location.pathname === '/') {
            window.location.reload()
            return
        }
        window.location.href = '/'
    }

    render() {
        const { error } = this.props
        const refreshBtn = <button className='button' onClick={this.refreshIt}>{tt('g.refresh')}</button>
        const { errStr, infoStr } = error
        return <div style={{padding: '1rem'}}>
            <h4>{tt('fatal_error_jsx.render_error')}</h4><br/>
            {refreshBtn}<br/>
            <b>{errStr}</b><br/>
            <pre>{infoStr}</pre><br/>
            {refreshBtn}
        </div>
    }
}

export default RenderError
