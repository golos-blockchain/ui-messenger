import React from 'react'
import {connect} from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { api, formatter } from 'golos-lib-js'
import { Asset, Price, AssetEditor } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import FormikAgent from 'app/components/elements/donate/FormikUtils'
import Stepper from 'app/components/elements/messages/Stepper'
import GroupName, { validateNameStep } from 'app/components/modules/groups/GroupName'
import GroupLogo from 'app/components/modules/groups/GroupLogo'

const STEPS = () => { return {
    name: tt('create_group_jsx.step_name'),
    logo: tt('create_group_jsx.step_logo'),
    admin: tt('create_group_jsx.step_admin'),
    create: tt('create_group_jsx.step_create')
} }

class CreateGroup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            step: 'name',
            initialValues: {
                title: '',
                name: '',
                is_encrypted: true,
                privacy: 'public_group',

                logo: '',
            }
        }
        this.stepperRef = React.createRef()
    }

    componentDidMount = async () => {
        try {
            const dgp = await api.getDynamicGlobalProperties()
            const { min_golos_power_to_emission } = dgp
            const minVS = await Asset(min_golos_power_to_emission[0])

            const acc = this.props.currentAccount.toJS()
            let { vesting_shares } = acc
            vesting_shares = Asset(vesting_shares)

            if (vesting_shares.gte(minVS)) {
                this.setState({
                    loaded: true
                })
                return
            }

            const minGolos = await Asset(min_golos_power_to_emission[1])
            const vsGolos = formatter.vestToGolos(vesting_shares, dgp.total_vesting_shares, dgp.total_vesting_fund_steem)
            const delta = minGolos.minus(vsGolos)
            this.setState({
                loaded: true,
                createError: {
                    minGolos,
                    vsGolos,
                    delta,
                    accName: acc.name
                }
            })
        } catch (err) {
            console.error(err)
            this.setState({
                loaded: true,
                createError: {
                    message: err.message
                }
            })
        }
    }

    validate = async (values) => {
        const errors = {}
        const { step } = this.state
        if (step === 'name') {
            await validateNameStep(values, errors, (validating) => this.setState({ validating }))
        }
        return errors
    }

    _onSubmit = () => {
    }

    goNext = (e, setFieldValue) => {
        e.preventDefault()
        const step = this.stepperRef.current.nextStep()
        this.setState({
            step
        })
    }

    render() {
        const { step, loaded, createError, validating } = this.state

        let form
        if (!loaded) {
            form = <center>
                <LoadingIndicator type='circle' />
            </center>
        } else if (createError) {
            const { message, minGolos, delta, vsGolos, accName } = createError
            if (message) {
                form = <div className='callout alert'>
                    {message}
                </div>
            } else {
                form = <div className='callout alert' title={tt('create_group_jsx.golos_power_too_low3') + vsGolos.floatString}>
                    {tt('create_group_jsx.golos_power_too_low') + minGolos.floatString + '. '}<br/>
                    {tt('create_group_jsx.golos_power_too_low2')}
                    <b>{delta.floatString}</b>.<br/>
                    <ExtLink service='wallet' href={'/@' + accName} target='_blank' rel='noopener noreferrer'>
                        <button style={{marginTop: '1rem'}} className='button small'>{tt('create_group_jsx.deposit_gp')}</button>
                    </ExtLink>
                </div>
            }
        } else
        form = (<Formik
            initialValues={this.state.initialValues}
            enableReinitialize={true}
            validateOnMount={true}
            validate={this.validate}
            onSubmit={this._onSubmit}
        >
        {({
            handleSubmit, isSubmitting, isValid, values, setFieldValue, setFieldTouched, handleChange,
        }) => {
            const disabled = !isValid || validating
            return (
        <Form>

            {step === 'name' ? <GroupName values={values} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} /> :
            step === 'logo' ? <GroupLogo values={values} setFieldValue={setFieldValue} setFieldTouched={setFieldTouched} /> :
            <React.Fragment></React.Fragment>}

            <Stepper ref={this.stepperRef} steps={STEPS()} startStep='name' />
            {isSubmitting ? <span><LoadingIndicator type='circle' /><br /></span>
            : <span>
                <button onClick={this.goNext} disabled={disabled} className='button small next-button' title={validating ?
                    tt('create_group_jsx.validating') : tt('create_group_jsx.submit')}>
                    <Icon name='chevron-right' size='1_25x' />
                </button>
            </span>}
        </Form>
        )}}</Formik>)

        return <div className='CreateGroup'>
               <div className='row'>
                   <h3>{tt('msgs_start_panel.create_group')}</h3>
               </div>
               {form}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        return { ...ownProps,
            currentUser,
            currentAccount,
        }
    },
    dispatch => ({
    })
)(CreateGroup)
