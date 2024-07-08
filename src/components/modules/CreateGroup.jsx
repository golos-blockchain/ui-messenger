import React from 'react'
import {connect} from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { api } from 'golos-lib-js'
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
import GroupLogo, { validateLogoStep } from 'app/components/modules/groups/GroupLogo'
import GroupMembers, { validateMembersStep } from 'app/components/modules/groups/GroupMembers'
import GroupFinal from 'app/components/modules/groups/GroupFinal'
import DialogManager from 'app/components/elements/common/DialogManager'
import { showLoginDialog } from 'app/components/dialogs/LoginDialog'

const STEPS = () => { return {
    name: tt('create_group_jsx.step_name'),
    logo: tt('create_group_jsx.step_logo'),
    members: tt('create_group_jsx.step_members'),
    final: tt('create_group_jsx.step_create')
} }

class ActionOnUnmount extends React.Component {
    componentWillUnmount() {
        const { values, stripGroupMembers } = this.props
        if (!values || !stripGroupMembers) {
            console.warn('ActionOnUnmount rendered without req props')
            return
        }
        const { name } = values
        if (name) {
            this.props.stripGroupMembers(name)
        }
    }
    render () {
        return null
    }
}

class CreateGroup extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            step: 'name',
            validators: 0,
            initialValues: {
                creatingNew: true,

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
            const dgp = await api.getChainPropertiesAsync()
            const { private_group_cost } = dgp
            const cost = await Asset(private_group_cost)

            let acc = await api.getAccountsAsync([this.props.currentAccount.get('name')])
            acc = acc[0]
            const { sbd_balance } = acc
            const gbgBalance = Asset(sbd_balance)
            if (gbgBalance.gte(cost)) {
                this.setState({
                    cost,
                    loaded: true
                })
                return
            }

            const delta = cost.minus(gbgBalance)
            this.setState({
                loaded: true,
                createError: {
                    cost,
                    gbgBalance,
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

    setValidating = async (validating) => {
        return new Promise(resolve => {
            this.setState({
                validators: this.state.validators + (validating ? 1 : -1),
            }, () => {
                resolve()
            })
        })
    }

    validate = async (values) => {
        const errors = {}
        const { step } = this.state
        await this.setValidating(true)
        if (step === 'name') {
            await validateNameStep(values, errors)
        } else if (step === 'logo') {
            await validateLogoStep(values, errors)
        } else if (step === 'members') {
            await validateMembersStep(values, errors)
        }
        await this.setValidating(false)
        return errors
    }

    _onSubmit = (data, actions) => {
        const { currentUser, redirectAfter } = this.props
        const creator = currentUser.get('username')
        data.creator = creator

        this.setState({
            submitError: ''
        })

        let members = []
        const { name } = data
        let { groups } = this.props
        if (groups) {
            groups = groups.toJS()
            const group = groups[name]
            if (group) {
                let mems = group.members
                if (mems) {
                    members = mems.data
                }
            }
        }

        showLoginDialog(creator, (res) => {
            const password = res && res.password
            if (!password) {
                actions.setSubmitting(false)
                return
            }
            try {
                const finalSuccess = () => {
                    actions.setSubmitting(false)
                    const { closeMe } = this.props
                    if (closeMe) closeMe()
                    if (redirectAfter) {
                        window.location.href = '/' + data.name
                        return
                    }
                }
                this.props.privateGroup({
                    password,
                    ...data,
                    onSuccess: () => {
                        try {
                            if (!members.length) {
                                finalSuccess()
                                return
                            }

                            this.props.groupMembers({
                                requester: data.creator,
                                name: data.name,
                                members,
                                onSuccess: () => {
                                    finalSuccess()
                                },
                                onError: (err, errStr) => {
                                    this.setState({ submitError: {
                                        type: 'members', err: errStr } })
                                    actions.setSubmitting(false)
                                }
                            })
                        } catch (err) {
                            this.setState({ submitError: {
                                type: 'members', err: err.toString() } })
                            actions.setSubmitting(false)
                        }
                    },
                    onError: (err, errStr) => {
                        this.setState({ submitError: errStr })
                        actions.setSubmitting(false)
                    }
                })
            } catch (err) {
                this.setState({ submitError: err.toString() })
                actions.setSubmitting(false)
            }
        }, 'active')
    }

    goNext = (e, setFieldValue) => {
        const { step } = this.state
        if (step === 'final') {
            return
        }
        e.preventDefault()
        this.stepperRef.current.nextStep()
    }

    onStep = ({ step }) => {
        this.setState({
            step
        })
    }

    render() {
        const { step, loaded, createError, validators, submitError, cost } = this.state

        let form
        if (!loaded) {
            form = <center>
                <LoadingIndicator type='circle' />
            </center>
        } else if (createError) {
            const { message, cost, gbgBalance, delta, accName } = createError
            if (message) {
                form = <div className='callout alert'>
                    {message}
                </div>
            } else {
                form = <div className='callout alert' title={tt('create_group_jsx.gbg_too_low3') + gbgBalance.floatString}>
                    {tt('create_group_jsx.gbg_too_low') + cost.floatString + '. '}<br/>
                    {tt('create_group_jsx.gbg_too_low2')}
                    <b>{delta.floatString}</b>.<br/>
                    <ExtLink service='wallet' href={'/@' + accName} target='_blank' rel='noopener noreferrer'>
                        <button style={{marginTop: '1rem'}} className='button small'>{tt('chain_errors.insufficient_top_up')}</button>
                    </ExtLink>
                </div>
            }
        } else
        form = (<Formik
            initialValues={this.state.initialValues}
            enableReinitialize={true}
            validateOnMount={true}
            validateOnBlur={false}
            validate={this.validate}
            onSubmit={this._onSubmit}
        >
        {({
            handleSubmit, isSubmitting, isValid, values, errors, setFieldValue, applyFieldValue, setFieldTouched, handleChange,
        }) => {
            let disabled = !isValid || !!validators || !values.name
            if (submitError && submitError.type === 'members') {
                disabled = true
            }
            return (
        <Form>

            {!isSubmitting ? (step === 'name' ? <GroupName values={values} applyFieldValue={applyFieldValue} cost={cost} /> :
            step === 'logo' ? <GroupLogo isValidating={!!validators} values={values} errors={errors} applyFieldValue={applyFieldValue} /> :
            step === 'members' ? <GroupMembers newGroup={values} applyFieldValue={applyFieldValue} /> :
            step === 'final' ? <GroupFinal newGroup={values} submitError={submitError} cost={cost} /> :
            <React.Fragment></React.Fragment>) : null}

            {!isSubmitting && <Stepper ref={this.stepperRef} steps={STEPS()} startStep={step}
                onStep={this.onStep} />}
            {/*submitError && <div className='error submit-error'>{submitError}</div>*/}
            {isSubmitting ? <span className='submit-loader'><LoadingIndicator type='circle' /><br /></span>
            : <span>
                <button onClick={this.goNext} disabled={disabled} className='button small next-button' title={validators ?
                    tt('create_group_jsx.validating') :
                    step === 'final' ? tt('create_group_jsx.submit') : tt('create_group_jsx.next')}>
                    <Icon name='chevron-right' size='1_25x' />
                </button>
            </span>}
            <ActionOnUnmount values={values} stripGroupMembers={this.props.stripGroupMembers} />
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

        const groups = state.global.get('groups')

        return { ...ownProps,
            currentUser,
            currentAccount,
            groups,
            redirectAfter: state.user.get('create_group_redirect_after'),
        }
    },
    dispatch => ({
        stripGroupMembers: (group) => {
            dispatch(g.actions.receiveGroupMembers({
                group, members: [], append: false }))
        },
        privateGroup: ({ password, creator, name, title, logo, is_encrypted, privacy,
        onSuccess, onError }) => {
            const trx = []
            let json_metadata, opData, json

            json_metadata = {
                app: 'golos-messenger',
                version: 1,
                title,
                logo
            }
            json_metadata = JSON.stringify(json_metadata)
            opData = {
                creator,
                name,
                json_metadata,
                is_encrypted,
                privacy,
                extensions: [],
            }
            json = JSON.stringify(['private_group', opData])
            trx.push(['custom_json', {
                id: 'private_message',
                required_auths: [creator],
                json,
            }])

            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                trx,
                username: creator,
                keys: [password],
                successCallback: onSuccess,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }));
        },
        groupMembers: ({ requester, name, members,
        onSuccess, onError }) => {
            const trx = []
            let opData, json

            for (const mem of members) {
                const { account, member_type, json_metadata } = mem
                opData = {
                    requester,
                    name,
                    member: account,
                    member_type,
                    json_metadata: '{}',
                    extensions: [],
                }
                json = JSON.stringify(['private_group_member', opData])
                trx.push(['custom_json', {
                    id: 'private_message',
                    required_posting_auths: [requester],
                    json,
                }])
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                trx,
                username: requester,
                successCallback: onSuccess,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }));
        },
    })
)(CreateGroup)
