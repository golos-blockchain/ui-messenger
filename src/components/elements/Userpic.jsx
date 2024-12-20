import React, { Component } from 'react';
import PropTypes from 'prop-types'
import { connect } from 'react-redux';
import cn from 'classnames';
import tt from 'counterpart'

import CircularProgress from './CircularProgress'
import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl';
import LetteredAvatar from 'app/components/elements/messages/LetteredAvatar'

class Userpic extends Component {
    static propTypes = {
        account: PropTypes.string,
        disabled: PropTypes.bool,
        votingPower: PropTypes.number,
        showProgress: PropTypes.bool,
        progressClass: PropTypes.string,
        imageUrl: PropTypes.string,
        title: PropTypes.string,
        onClick: PropTypes.func,
    }

    static defaultProps = {
        width: 48,
        height: 48,
        disabled: false,
        hideIfDefault: false,
        showProgress: false
    }

    state = {
        showProgress: this.props.showProgress,
        showPower: false
    }

    extractUrl = () => {
        const { json_metadata, width, hideIfDefault, imageUrl } = this.props

        let url = null;

        // TODO: Rewrite bottom block

        if (imageUrl) {
            url = imageUrl
        } else {
            // try to extract image url from users metaData
            try {
                const md = JSON.parse(json_metadata);
                if (md.profile) url = md.profile.profile_image;
            } catch (e) {
                console.warn('Try to extract image url from users metaData failed!')
            }
        }

        let isDefault = false

        if (url && /^(https?:)\/\//.test(url)) {
            const size = width && width > 75 ? '200x200' : '75x75';
            url = proxifyImageUrlWithStrip(url, size);
        } else {
            if (hideIfDefault) {
                return null;
            }
            url = require('app/assets/images/user.png');
            isDefault = true
        }

        return { url, isDefault }
    }

    votingPowerToPercents = power => power / 100

    toggleProgress = () => this.setState({
        showProgress: !this.state.showProgress,
        showPower: !this.state.showPower
    })

    getVotingIndicator = (percentage) => {
        const { progressClass } = this.props
        const { showProgress, showPower } = this.state

        const votingClasses = cn('voting_power', {
            'show-progress': showProgress,
            'show-power': showPower
        }, progressClass)

        return (
            <div className={votingClasses}>
                <CircularProgress
                    percentage={percentage}
                    show={showProgress}
                    size={this.props.width}
                    strokeWidth={2.5}
                />
            </div>
        )
    }

    render() {
        const { account, disabled, title, width, height, votingPower, reputation, hideReputationForSmall, showProgress, onClick } = this.props

        const { url, isDefault } = this.extractUrl()

        const style = {
            width: `${width}px`,
            height: `${height}px`,
            backgroundImage: `url(${url})`
        }

        let lettered
        if (isDefault) {
            lettered = <LetteredAvatar name={account} size={height}
                backgroundColor={disabled ? '#999' : undefined} />
        }

        if (votingPower) {
            const percentage = this.votingPowerToPercents(votingPower)
            const toggle = showProgress ? () => { } : this.toggleProgress

            return (
                <div className="Userpic" title={title} onClick={toggle} style={style}>
                    {percentage ? this.getVotingIndicator(percentage) : null}
                </div>
            )
        } else if (reputation !== undefined) {
            return <div className="Userpic_parent" onClick={onClick}>
                    <div className="Userpic" title={title} style={style}></div>
                    <div className="Userpic__badge" title={tt('g.reputation')}>{reputation}</div>
                </div>
       } else {
            return <div className="Userpic" title={title} style={style} onClick={onClick}>
                {lettered}
            </div>
        }
    }
}

export default connect(
    (state, props) => {
        const { account, width, height, hideIfDefault, onClick } = props;

        return {
            json_metadata: state.global.getIn(['accounts', account, 'json_metadata']),
            width,
            height,
            hideIfDefault,
            onClick,
        };
    }
)(Userpic)
