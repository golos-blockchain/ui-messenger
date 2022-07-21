import React from 'react'
import {connect} from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { Asset, AssetEditor } from 'golos-lib-js/lib/utils'
import tt from 'counterpart'
import Confetti from 'react-dom-confetti'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import AmountField from 'app/components/elements/donate/AmountField'
import PresetSelector from 'app/components/elements/donate/PresetSelector'
import TipAssetList from 'app/components/elements/donate/TipAssetList'
import FormikAgent from 'app/components/elements/donate/FormikUtils'

export const CONFETTI_CONFIG = {
    angle: "90",
    spread: "360",
    startVelocity: "20",
    elementCount: "50",
    dragFriction: "0.1",
    duration: "2000",
    stagger: 0,
    width: "10px",
    height: "10px",
    colors: ["#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a"]
};

class Donate extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            initialValues: {
                amount: AssetEditor(0, 3, 'GOLOS'),
            },
        }
    }

    componentDidMount() {
        this.props.fetchBalance(this.props.currentUser)
        this.props.fetchUIABalances(this.props.currentUser)
    }

    balanceValue = () => {
        let res = null
        const { opts, currentAccount } = this.props
        const { sym } = opts
        if (sym === 'GOLOS') {
            if (currentAccount) {
                res = Asset(currentAccount.get('tip_balance'))
            }
        } else {
            const uias = this.props.uias && this.props.uias.toJS()
            if (uias) {
                res = Asset(uias[sym].tip_balance)
            }
        }
        return res
    }

    validate = (values) => {
        const errors = {}
        const balance = this.balanceValue()
        if (balance && values.amount.asset.gt(balance)) {
            errors.amount = tt('donate_jsx.insufficient_funds')
        }
        return errors
    }

    onPresetChange = (amountStr, values, setFieldValue) => {
        const add = values.amount.asset.clone()
        add.amountFloat = amountStr

        let amount = values.amount.asset.clone()
        amount = amount.plus(add)
        amount = AssetEditor(amount)
        setFieldValue('amount', amount)
    }

    onTipAssetChanged = (sym, precision) =>{
        const donateDefs = {...this.props.opts}
        donateDefs.sym = sym
        donateDefs.precision = precision
        this.props.setDonateDefaults(donateDefs)
    }

    _onSubmit = (values, actions) => {
        const { currentUser, opts, dispatchSubmit } = this.props
        const { from, to, nonce } = opts
        this.setState({
            activeConfetti: true
        })
        setTimeout(() => {
            dispatchSubmit({
                message: { from, to, nonce },
                amount: values.amount.asset,
                currentUser,
                errorCallback: (err) => {
                    actions.setErrors({ amount: err.message || err })
                    actions.setSubmitting(false)
                }
            })
        }, 1000)
    }

    render() {
        const { currentUser, currentAccount, opts, uias } = this.props
        const { sym } = opts
        const { activeConfetti } = this.state

        const form = (<Formik
            initialValues={this.state.initialValues}
            enableReinitialize={true}
            validate={this.validate}
            onSubmit={this._onSubmit}
        >
        {({
            handleSubmit, isSubmitting, isValid, values, setFieldValue, handleChange,
        }) => {
            const disabled = !isValid || (!values.amount.asset.amount)
            return (
        <Form>
            <div className="DonatePresets column" style={{ marginTop: '0.75rem' }}>
                <PresetSelector
                    username={currentUser.get('username')}
                    amountStr={values.amount.amountStr}
                    onChange={amountStr => this.onPresetChange(amountStr, values, setFieldValue)}
                />
                <TipAssetList
                    value={sym} uias={uias} currentAccount={currentAccount}
                    currentBalance={this.balanceValue()}
                    onChange={this.onTipAssetChanged}
                />
            </div>

            <div className='row' style={{ marginTop: '1.0rem', marginBottom: '1.0rem' }}>
                <div className='column small-3' style={{paddingTop: 5}}>
                    {tt('donate_jsx.donate_amount')}
                </div>
                <div className='column small-9'>
                    <div className='input-group' style={{marginBottom: 5}}>
                        <AmountField
                            placeholder={tt('donate_jsx.donate_amount')}
                        />
                        <span style={{paddingLeft: '10px', paddingTop: '7px', backgroundColor: 'transparent', border: 'none'}}>
                            {sym}
                        </span>
                    </div>
                    <ErrorMessage name='amount' component='div' className='error' />

                    <Confetti config={CONFETTI_CONFIG} active={activeConfetti} />
                </div>
            </div>

            {isSubmitting ? <span><LoadingIndicator type='circle' /><br /></span>
            : <span>
                <button type='submit' disabled={disabled} className='button'>
                    {tt('donate_jsx.submit')}
                </button>
            </span>}

            <FormikAgent opts={opts} setFieldValue={setFieldValue}
                currentUser={currentUser} />
        </Form>
        )}}</Formik>)

        return <div>
               <div className='row'>
                   <h3>{tt('donate_jsx.title')}</h3>
               </div>
            {form}
        </div>
    }
}

export default connect(
    (state, ownProps) => {
        const opts = state.user.get('donate_defaults', Map()).toJS()

        const currentUser = state.user.getIn(['current'])
        const currentAccount = currentUser && state.global.getIn(['accounts', currentUser.get('username')])

        let uias = state.global.get('assets')
        let uia 
        if (uias) {
            uia = uias.get(opts.sym)
        }

        return { ...ownProps,
            currentUser,
            currentAccount,
            opts,
            uias
        }
    },
    dispatch => ({
        fetchBalance: (currentUser) => {
            if (!currentUser) return
            dispatch(user.actions.getAccount())
        },
        fetchUIABalances: (currentUser) => {
            if (!currentUser) return
            const account = currentUser.get('username')
            dispatch(g.actions.fetchUiaBalances({ account }))
        },
        setDonateDefaults: (donateDefaults) => {
            dispatch(user.actions.setDonateDefaults(donateDefaults))
        },
        dispatchSubmit: ({
            message, amount, currentUser, errorCallback
        }) => {
            const { from, to, nonce } = message

            const username = currentUser.get('username')

            let operation = {
                from: username, to: from, amount: amount.toString()
            }

            operation.memo = {
                app: 'golos-messenger', version: 1, comment: '',
                target: {
                    from, to, nonce: nonce.toString()
                }
            }

            let trx = [
                ['donate', operation]
            ]

            const successCallback = () => {
                dispatch(user.actions.hideDonate())
            }

            dispatch(transaction.actions.broadcastOperation({
                type: 'donate', username, trx, successCallback, errorCallback
            }))
        }
    })
)(Donate)
