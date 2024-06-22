import React from 'react'
import {connect} from 'react-redux'
import { Formik, Form, Field, ErrorMessage, } from 'formik'
import { Map } from 'immutable'
import { api, formatter } from 'golos-lib-js'
import tt from 'counterpart'

import g from 'app/redux/GlobalReducer'
import transaction from 'app/redux/TransactionReducer'
import user from 'app/redux/UserReducer'
import { session } from 'app/redux/UserSaga'
import DropdownMenu from 'app/components/elements/DropdownMenu'
import ExtLink from 'app/components/elements/ExtLink'
import Icon from 'app/components/elements/Icon'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import DialogManager from 'app/components/elements/common/DialogManager'
import { showLoginDialog } from 'app/components/dialogs/LoginDialog'
import { getGroupLogo, getGroupMeta, getGroupTitle } from 'app/utils/groups'

class GroupSettings extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            loaded: false
        }
    }

    componentDidMount() {
        const { currentGroup } = this.props
        const group = currentGroup.toJS()
        const { name, member_list, privacy, json_metadata } = group
        const meta = getGroupMeta(json_metadata)
        let admin
        for (const mem of member_list) {
            if (mem.member_type === 'admin') {
                admin = mem.account
            }
            break
        }
        const initialValues = {
            title: meta.title,
            logo: meta.logo,
            admin,
            privacy
        }
        this.setState({
            initialValues
        })
    }

    onTitleChange = (e, { applyFieldValue }) => {
        const { value } = e.target
        if (value.trimLeft() !== value) {
            return
        }
        applyFieldValue('title', value)
    }

    onLogoChange = (e, { applyFieldValue }) => {
        const { value } = e.target
        applyFieldValue('logo', value)
    }

    onAdminChange = (e, { applyFieldValue }) => {
        const { value } = e.target
        applyFieldValue('admin', value)
    }

    validate = async () => {

    }

    onSubmit = async () => {

    }

    closeMe = (e) => {
        e.preventDefault()
        this.props.closeMe()
    }

    render() {
        const { currentGroup } = this.props
        const group = currentGroup.toJS()
        const { name, json_metadata } = group

        const meta = getGroupMeta(json_metadata)
        const title = getGroupTitle(meta, name)

        const { initialValues } = this.state

        let form
        if (!initialValues) {
            form = <LoadingIndicator type='circle' />
        } else {
            form = <Formik
                initialValues={initialValues}
                enableReinitialize={true}
                validateOnMount={true}
                validateOnBlur={false}
                validate={this.validate}
                onSubmit={this._onSubmit}
            >
            {({
                handleSubmit, isSubmitting, isValid, values, errors, setFieldValue, applyFieldValue, setFieldTouched, handleChange,
            }) => {
                const disabled = !isValid
                return (
            <Form>
                <div className='row'>
                    <div className='column small-6'>
                        {tt('create_group_jsx.title')}
                        <Field
                            type='text'
                            name='title'
                            maxLength='48'
                            onChange={e => this.onTitleChange(e, { applyFieldValue })}
                            autoFocus
                            validateOnBlur={false}
                        />
                    </div>
                    <div className='column small-6'>
                        {tt('create_group_jsx.name2')}<br/>
                        <div style={{ marginTop: '0.5rem' }}>
                            {tt('create_group_jsx.name3')}{name}
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '1rem' }}>
                    <div className='column small-12'>
                        {tt('create_group_jsx.logo')}
                        <div className="input-group">
                            <Field
                                type='text'
                                name='logo'
                                className="input-group-field" 
                                maxLength='1024'
                                placeholder='https://'
                                onChange={e => this.onLogoChange(e, { applyFieldValue })}
                                validateOnBlur={false}
                            />
                            <span className="input-group-label">{tt('group_settings_jsx.upload')}</span>
                        </div>
                    </div>
                </div>
                <div className='row' style={{ marginTop: '0rem' }}>
                    <div className='column small-12'>
                        {tt('create_group_jsx.admin')}
                        <Field
                            type='text'
                            name='admin'
                            maxLength='16'
                            onChange={e => this.onAdminChange(e, { applyFieldValue })}
                            validateOnBlur={false}
                        />
                    </div>
                </div>
                <div style={{ marginTop: '1rem' }}>
                    <button className='button hollow float-right' onClick={this.closeMe}>
                        {tt('g.cancel')}
                    </button>
                    <button type='submit' className='button float-right'>
                        {tt('group_settings_jsx.submit')}
                    </button>
                </div>
            </Form>
            )}}</Formik>
        }

        return <div className='GroupSettings'>
            <div className='row'>
                <h3>{tt('group_settings_jsx.title_GROUP', {
                    GROUP: title
                })}</h3>
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
            currentGroup: state.user.get('current_group'),
        }
    },
    dispatch => ({
    })
)(GroupSettings)
