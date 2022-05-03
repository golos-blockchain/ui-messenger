import React from 'react'
import tt from 'counterpart'

import DialogManager from 'app/components/elements/common/DialogManager'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { checkUpdates, getChangelog } from 'app/utils/app/UpdateUtils'

class AppUpdateChecker extends React.Component {
    state = {
    }

    async componentDidMount() {
        if (this.props.dialog) {
            this._checkAndDialog()
        } else {
            this.setState({ loading: true }, async () => {
                const res = await checkUpdates()
                if (res.version) {
                    let changes = await getChangelog(res)
                    this.setState({
                        loading: false,
                        availVersion: res.version,
                        changes,
                        exeLink: res.exeLink
                    })
                } else {
                    this.setState({
                        loading: false,
                    })
                }
            })
        }
        document.addEventListener('resume', this.onResume)
    }

    componentWillUnmount() {
        document.removeEventListener('resume', this.onResume)
    }

    onResume = () => {
        const { dialog } = this.props
        if (dialog) {
            setTimeout(() => {
                this._checkAndDialog()
            }, 0)
        }
    }

    _dialog = async (version, changes, exeLink) => {
        let msg = tt('app_update.notify') + ' - ' + version
        msg += '. ' + tt('app_update.download') + '?'

        let content = [
            <span key='1'>{msg}</span>,
            <br key='2' />,
            <br key='3' />,
            <span key='4' style={{ whiteSpace: 'pre-line' }}>{changes}</span>
        ]

        const conf = await DialogManager.confirm(
            <div style={{ overflowY: 'auto', maxHeight: '200px'}}>
            {content}</div>, 'GOLOS Messenger')
        if (conf) {
            window.location.href = exeLink
        }

        return !!conf
    }

    _checkAndDialog = async () => {
        const res = await checkUpdates()
        const memKey = 'skippedVersion'
        if (res.version && localStorage.getItem(memKey) !== res.version) {
            let changes = await getChangelog(res)

            const conf = await this._dialog(res.version, changes, res.exeLink)
            if (!conf) {
                localStorage.setItem(memKey, res.version)
            }
        }
    }

    linkClicked = (e) => {
        e.preventDefault()
        const { availVersion, changes, exeLink } = this.state
        this._dialog(availVersion, changes, exeLink)
    }

    render() {
        const { dialog, troubleshoot, style } = this.props
        const { availVersion, loading } = this.state
        if (dialog) {
            return null
        }
        let content
        if (availVersion) {
            let link = <a href='#' onClick={this.linkClicked}>{availVersion}</a>
            if (troubleshoot) {
                content = <div>
                    {tt('app_update.notify') + ' - '}
                    {link}.
                    <br />
                    {tt('app_update.troubleshoot')}
                    </div>
            } else {
                content = <div>
                    {tt('app_update.notify') + ' - '}
                    {link}
                    </div>
            }
        } else if (loading) {
            content = <div>
                <LoadingIndicator type='circle' size='21px' />
            </div>
        }
        return <div style={style}>{content}</div>
    }
}

export default AppUpdateChecker
