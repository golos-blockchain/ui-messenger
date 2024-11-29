import React from 'react'

import './Stepper.scss'

class Stepper extends React.Component {
    constructor(props) {
        super(props)
        const { steps, startStep } = this.props
        const entr = Object.entries(steps)
        this.state = {
            currentStep: startStep || entr[0][0]
        }
    }

    _goToStep = (step) => { // TODO: private, if make public - check step exists
        this.setState({
            currentStep: step
        }, () => {
            const { onStep } = this.props
            if (onStep) {
                onStep({ step })
            }
        })
    }

    nextStep = () => {
        const { steps } = this.props
        const entr = Object.entries(steps)
        const { currentStep } = this.state
        let found
        for (const [key, content] of entr) {
            if (found) {
                this._goToStep(key)
                return key
            }
            found = key === currentStep
        }
        return currentStep
    }

    render() {
        const { steps } = this.props
        let { currentStep } = this.state

        const entr = Object.entries(steps)
        currentStep = currentStep || entr[0][0]
        const width = (100 / entr.length).toFixed(1)
        const stepObjs = []
        let foundCurrent
        for (const [key, content] of entr) {
            const isCurrent = key === currentStep
            foundCurrent = foundCurrent || isCurrent
            const cn = foundCurrent ? (isCurrent ? 'current' : '') : 'left' 
            let onClick
            if (!foundCurrent) {
                onClick = (e) => {
                    e.preventDefault()
                    this._goToStep(key)
                }
            }
            stepObjs.push(<div className={'step ' + cn} style={{ minWidth: width + '%' }} onClick={onClick}>
                    <div className={'bar'}></div>
                    {content}
                </div>)
        }

        return <div className='Stepper'>
            {stepObjs}
        </div>
    }
}

export default Stepper
