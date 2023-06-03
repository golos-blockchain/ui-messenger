import React from 'react'
import tt from 'counterpart'

import QRCode from 'app/components/elements/QrCode'

class AppDownload extends React.Component {
    componentDidMount() {
    }

    render() {
        const updaterHost = 'https://files.golos.app'
        const winUrl = new URL('/api/exe/desktop/windows/latest', updaterHost).toString()
        const linuxUrl = new URL('/api/exe/desktop/linux/latest', updaterHost).toString()
        const androidUrl = new URL('/api/exe/messenger/android/latest', updaterHost).toString()
        return <div>
            <h4>{tt('app_download.title')}</h4>
            <a href={winUrl} target='_blank' rel='nofollow noreferrer' title={tt('app_download.download_for') + ' Windows'}>
                <img src={require('app/assets/images/windows.png')} />
                Windows
            </a><br />
            <a href={linuxUrl} title={tt('app_download.download_for') + ' Linux'}>
                <img src={require('app/assets/images/linux.png')} />
                Linux (deb)
            </a><br />
            <a href={androidUrl} title={tt('app_download.download_for') + ' Android'}>
                <img src={require('app/assets/images/android48x48.png')} />
                Android&nbsp;&nbsp;
                <QRCode text={androidUrl} size={1} />
            </a>
        </div>
    }
}

export default AppDownload
