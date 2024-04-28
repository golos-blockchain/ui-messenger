import React from 'react'
import {connect} from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { api, formatter } from 'golos-lib-js'
import { Asset, Price, AssetEditor } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import getSlug from 'speakingurl'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import FormikAgent from 'app/components/elements/donate/FormikUtils'
import Stepper from 'app/components/elements/messages/Stepper'

const STEPS = {
    name: tt('create_group_jsx.step_name'),
    logo: tt('create_group_jsx.step_logo'),
    admin: tt('create_group_jsx.step_admin'),
    create: tt('create_group_jsx.step_create')
}

class CreateGroup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            step: 'name',
            initialValues: {
                title: '',
                name: '',
                is_encrypted: true,
                privacy: 'public_group'
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
        if (!values.title) {
            errors.title = tt('g.required')
        }
        if (values.name) {
            if (values.name.length < 3) {
                errors.name = tt('create_group_jsx.group_min_length')
            } else {
                let group
                try {
                    console.time('x')
                    group = await api.getGroupsAsync({
                        start_group: values.name,
                        limit: 1
                    })
                    console.timeEnd('x')
                } catch (err) {
                    console.error(err)
                }
                if (group && group[0]) {
                    errors.name = tt('create_group_jsx.group_already_exists')
                }
            }
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

    onTitleChange = (e, setFieldValue, setFieldTouched) => {
        const { value } = e.target
        if (value.trimLeft() !== value) {
            return
        }
        setFieldValue('title', value)
        let link = getSlug(value)
        setFieldValue('name', link)
        setFieldTouched('name', true)
        this.setState({
            showName: true
        })
    }

    onNameChange = (e, setFieldValue) => {
        const { value } = e.target
        for (const c of value) {
            if ((c > 'z' || c < 'a') && c !== '-' && c !== '_') {
                return
            }
        }
        setFieldValue('name', value)
    }

    onPrivacyChange = (e, setFieldValue) => {
        setFieldValue('privacy', e.target.value)
        setFieldValue('is_encrypted', true)
    }

    render() {
        const { showName, step, loaded, createError } = this.state

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
            const disabled = !isValid
            return (
        <Form>

        {step === 'name' ? <React.Fragment>
                <div className='row' style={{ marginTop: '1.0rem', marginBottom: '1.0rem' }}>
                    <div className='column small-5' style={{paddingTop: 5}}>
                        {tt('create_group_jsx.title')}
                    </div>
                    <div className='column small-7'>
                        <Field
                            type='text'
                            name='title'
                            maxLength='48'
                            onChange={e => this.onTitleChange(e, setFieldValue, setFieldTouched)}
                            autoFocus
                        />
                        <ErrorMessage name='title' component='div' className='error' />
                    </div>
                </div>

                {showName ? <div className='row' style={{ marginTop: '1.0rem', marginBottom: '1.0rem' }}>
                    <div className='column small-5' style={{paddingTop: 5}}>
                        {tt('create_group_jsx.name')}
                    </div>
                    <div className='column small-7'>
                        <Field
                            type='text'
                            name='name'
                            maxLength='32'
                            onChange={e => this.onNameChange(e, setFieldValue)}
                        />
                        <ErrorMessage name='name' component='div' className='error' />
                    </div>
                </div> : null}

                <div className='row' style={{ marginTop: '1.0rem', marginBottom: '1.0rem' }}>
                    <div className='column small-5' style={{paddingTop: 5}}>
                        {tt('create_group_jsx.access')}
                        <Icon name='info_o' className='icon-hint' title={tt('create_group_jsx.access_hint')} />
                    </div>
                    <div className='column small-7'>
                        <Field
                            as='select'
                            name='privacy'
                            onChange={e => this.onPrivacyChange(e, setFieldValue)}
                        >
                            <option value='public_group'>{tt('create_group_jsx.access_all')}</option>
                            <option value='public_read_only'>{tt('create_group_jsx.all_read_only')}</option>
                            <option value='private_group'>{tt('create_group_jsx.access_private')}</option>
                        </Field>
                        <ErrorMessage name='privacy' component='div' className='error' />
                    </div>
                </div>

                <div className='row' style={{ marginTop: '1.0rem', marginBottom: '1.0rem' }}>
                    <div className='column small-12'>
                        <label style={{fontSize: '100%'}}>
                            <Field
                                type='checkbox'
                                name='is_encrypted'
                                disabled={values.privacy === 'private_group'}
                            />
                            {tt('create_group_jsx.encrypted')}
                            <Icon name='info_o' className='icon-hint' title={tt('create_group_jsx.encrypted_hint')} />
                            {values.privacy === 'private_group' ? <span className='secondary'>{tt('create_group_jsx.encrypted_dis')}</span> : null}
                        </label>
                        <ErrorMessage name='is_encrypted' component='div' className='error' />
                    </div>
                </div>
            </React.Fragment> : <React.Fragment>
            </React.Fragment>}

            <Stepper ref={this.stepperRef} steps={STEPS} startStep='name' />
            {isSubmitting ? <span><LoadingIndicator type='circle' /><br /></span>
            : <span>
                <button onClick={this.goNext} disabled={disabled} className='button small next-button' title={tt('g.submit')}>
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
