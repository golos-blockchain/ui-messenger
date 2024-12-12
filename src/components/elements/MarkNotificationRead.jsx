import React from 'react';
import PropTypes from 'prop-types'
import {connect} from 'react-redux'

import { markNotificationRead } from 'app/utils/NotifyApiClient'

class MarkNotificationRead extends React.Component {

    static propTypes = {
        fields: PropTypes.string,
        account: PropTypes.string,
        update: PropTypes.func,
        interval: PropTypes.number,
        delay: PropTypes.number,
    };

    shouldComponentUpdate(nextProps) {
        if (this.props.interval !== nextProps.interval) {
            return true
        }
        return false;
    }

    _activateInterval = (interval) => {
        if (!this.interval) {
            const { account, update } = this.props;
            this.interval = setInterval(() => {
                markNotificationRead(account, this.fields_array).then(nc => update(nc));
            }, interval);
        }
    }

    _clearInterval =() => {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = undefined
        }
    }

    componentDidMount() {
        const { account, fields, update, interval, delay } = this.props;
        this.fields_array = fields.replace(/\s/g,'').split(',');
        const firstMark = () => {
            markNotificationRead(account, this.fields_array).then(nc => update(nc))
        }
        if (delay) {
            setTimeout(firstMark, delay)
        }
        if (interval) {
            this._activateInterval(interval);
        } else if (!delay) {
            firstMark()
        }
    }

    componentDidUpdate() {
        const { interval } = this.props
        if (interval) {
            this._activateInterval(interval);
        } else {
            this._clearInterval()
        }
    }

    componentWillUnmount() {
        this._clearInterval()
    }

    render() {
        return null;
    }

}

export default connect(null, dispatch => ({
    update: (payload) => { dispatch({type: 'UPDATE_NOTIFICOUNTERS', payload})},
}))(MarkNotificationRead);
