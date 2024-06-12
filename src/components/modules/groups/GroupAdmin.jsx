import React from 'react'
import { connect } from 'react-redux'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'
import { api } from 'golos-lib-js'
import { validateAccountName } from 'golos-lib-js/lib/utils'

import Input from 'app/components/elements/common/Input';

export async function validateAdminStep(values, errors) {
    if (!values.admin) {
        errors.admin = tt('g.required')
    } else {
        const nameError = validateAccountName(values.admin)
        if (nameError.error) {
            errors.admin = tt('account_name.' + nameError.error)
        } else {
            try {
                let accs = await api.getAccountsAsync([values.admin])
                accs = accs[0]
                if (!accs) {
                    errors.admin = tt('g.username_does_not_exist')
                }
            } catch (err) {
                console.error(err)
                errors.admin = 'Blockchain unavailable :('
            }
        }
    }
}

class GroupAdmin extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    componentDidMount() {
        this.load()
    }

    componentDidUpdate() {
        this.load()
    }

    load = () => {
        const { loaded } = this.state
        if (!loaded) {
            const { username, applyFieldValue } = this.props
            if (username) {
                applyFieldValue('admin', username)
                this.setState({
                    loaded: true
                })
            }
        }
    }

    onChange = async (e) => {
        e.preventDefault()
        const { applyFieldValue } = this.props
        applyFieldValue('admin', e.target.value)
    }

    render() {
        const { uploading } = this.state

        return <React.Fragment>
            <div className='row' style={{ marginTop: '0rem' }}>
                <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                    {tt('create_group_jsx.admin_desc')}
                </div>
            </div>
            <div className='row' style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                <div className='column small-12'>
                    <Field name='admin'
                        block
                        as={Input}
                        autoFocus
                        className='AddImageDialog__link-input'
                        onChange={e => this.onChange(e)}
                    >
                    </Field>
                    <ErrorMessage name='admin' component='div' className='error' />
                </div>
            </div>
        </React.Fragment>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        const currentUser = state.user.get('current')
        const username = currentUser && currentUser.get('username')
        return {
            ...ownProps,
            username,
        }
    },
    dispatch => ({
    })
)(GroupAdmin)
