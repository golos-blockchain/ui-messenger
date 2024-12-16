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
        if (this.props.interval !== nextProps.interval ||
            this.props.fields !== nextProps.fields) {
            return true
        }
        return false;
    }

    _markIt = () => {
        const { account, update } = this.props
        markNotificationRead(account, this.fields_array).then(nc => update(nc))
    }

    _activateInterval = (interval) => {
        if (!this.interval) {
            this.interval = setInterval(this._markIt, interval)
        }
    }

    _clearInterval =() => {
        if (this.interval) {
            clearInterval(this.interval)
            this.interval = undefined
        }
    }

    componentDidMount() {
        const { fields, interval, delay } = this.props;
        this.fields_array = fields.replace(/\s/g,'').split(',')
        if (delay) {
            setTimeout(this._markIt, delay)
        }
        if (interval) {
            this._activateInterval(interval);
        } else if (!delay) {
            this._markIt()
        }
    }

    componentDidUpdate(prevProps) {
        const { interval, delay, fields } = this.props
        if (prevProps.fields !== fields) {
            this.fields_array = fields.replace(/\s/g,'').split(',')
            if (delay) {
                setTimeout(this._markIt, delay)
            }
        }
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
