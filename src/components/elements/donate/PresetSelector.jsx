import React from 'react'
import PropTypes from 'prop-types'

class PresetSelector extends React.Component {
    static propTypes = {
        username: PropTypes.string.isRequired,
        amountStr: PropTypes.string.isRequired,
        onChange: PropTypes.func.isRequired,
    }

    onPresetClicked = (e) => {
        e.preventDefault()
        const preset = e.target.textContent.split('+')[1]
        const { onChange } = this.props
        if (onChange) {
            onChange(preset.split(' ')[0])
        }
    }

    render() {
        const { username, amountStr } = this.props

        let presets = ['5','10','25','50','100']

        let btnIdx = 0
        let btns = presets.map(preset => {
            let className = 'PresetSelector button hollow'
            className += (amountStr.split('.')[0] === preset ? ' PresetSelector__active' : '')
            return <button className={className} key={++btnIdx}
                onClick={this.onPresetClicked}>
                {'+' + preset}</button>
        })

        return <div className="PresetSelector__container">
                {btns}
            </div>
    }
}

export default PresetSelector
