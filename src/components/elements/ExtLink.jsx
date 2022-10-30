import React from 'react'

class ExtLink extends React.Component {
    render() {
        let { href, to, service, ...rest } = this.props
        if (!href) {
            href = to
        }
        if (!href) {
            href = undefined
        } else {
            try {
                if (service === 'wallet') {
                    href = new URL(href, $GLS_Config.wallet_service.host).toString()
                } else {
                    href = new URL(href, $GLS_Config.blogs_service.host).toString()
                }
            } catch (err) {
                console.error('ExtLink: cannot parse URL', err)
                href = '#'
            }
        }
        return (<a href={href} {...rest}>
                {this.props.children}
            </a>)
    }
}

export default ExtLink
