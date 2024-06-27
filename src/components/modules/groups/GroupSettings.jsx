import React from 'react'
import DropZone from 'react-dropzone'
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
import { validateLogoStep } from 'app/components/modules/groups/GroupLogo'
import { getGroupLogo, getGroupMeta, getGroupTitle } from 'app/utils/groups'
import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl'

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
        const { name, privacy, json_metadata, is_encrypted } = group
        const meta = getGroupMeta(json_metadata)
        const initialValues = {
            name,
            title: meta.title,
            logo: meta.logo,
            privacy,
            is_encrypted,
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

    uploadLogo = (file, name, { applyFieldValue }) => {
        const { uploadImage } = this.props
        this.setState({ uploading: true })
        uploadImage(file, progress => {
            if (progress.url) {
                applyFieldValue('logo', progress.url)
            }
            if (progress.error) {
                const { error } = progress;
                notify(error, 10000)
            }
            this.setState({ uploading: false })
        })
    }

    onDrop = (acceptedFiles, rejectedFiles, { applyFieldValue }) => {
        const file = acceptedFiles[0]

        if (!file) {
            if (rejectedFiles.length) {
                DialogManager.alert(
                    tt('post_editor.please_insert_only_image_files')
                )
            }
            return
        }

        this.uploadLogo(file, file.name, { applyFieldValue })
    };

    onPrivacyChange = (e, { applyFieldValue }) => {
        applyFieldValue('privacy', e.target.value)
    }

    validate = async (values) => {
        const errors = {}
        if (!values.title) {
            errors.title = tt('g.required')
        } else if (values.title.length < 3) {
            errors.title = tt('create_group_jsx.group_min_length')
        }
        await validateLogoStep(values, errors)
        return errors
    }

    _onSubmit = async (values, actions) => {
        const { currentUser } = this.props
        const creator = currentUser.get('username')

        this.setState({
            submitError: ''
        })

        showLoginDialog(creator, (res) => {
            const password = res && res.password
            if (!password) {
                actions.setSubmitting(false)
                return
            }
            this.props.privateGroup({
                creator,
                password,
                ...values,
                onSuccess: () => {
                    actions.setSubmitting(false)
                    const { closeMe } = this.props
                    if (closeMe) closeMe()
                },
                onError: (err, errStr) => {
                    this.setState({ submitError: errStr })
                    actions.setSubmitting(false)
                }
            })
        }, 'active', false)
    }

    closeMe = (e) => {
        e.preventDefault()
        this.props.closeMe()
    }

    _renderPreview = ({ values, errors }) => {
        let { logo } = values
        if (logo && !errors.logo) {
            const size = '75x75' // main size of Userpic
            logo = proxifyImageUrlWithStrip(logo, size);
            return <a href={logo} target='_blank' rel='noopener noreferrer' style={{ marginLeft: '0.5rem' }}>
                {tt('group_settings_jsx.preview')}
            </a>
        }
        return null
    }

    render() {
        const { currentGroup } = this.props
        const group = currentGroup.toJS()
        const { name, json_metadata } = group

        const meta = getGroupMeta(json_metadata)
        const title = getGroupTitle(meta, name)

        const { initialValues, submitError } = this.state

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
                const disabled = !isValid || this.state.uploading
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
                        <ErrorMessage name='title' component='div' className='error' />
                    </div>
                    <div className='column small-6' title={tt('group_settings_jsx.name_cannot_change')}>
                        {tt('create_group_jsx.name2')}<br/>
                        <div style={{ marginTop: '0.5rem' }}>
                            {tt('create_group_jsx.name3')}{name}
                        </div>
                    </div>
                </div>

                <div className='row' style={{ marginTop: '1rem' }}>
                    <div className='column small-12'>
                        {tt('create_group_jsx.logo')}{this._renderPreview({ values, errors })}
                        <DropZone
                            multiple={false}
                            noClick={true}
                            accept='image/*'
                            onDrop={(af, rf) => this.onDrop(af, rf, { applyFieldValue })}
                        >
                            {({getRootProps, getInputProps, open}) => (<div className="input-group" {...getRootProps()}>
                                <input {...getInputProps()} />
                                <Field
                                    type='text'
                                    name='logo'
                                    className="input-group-field" 
                                    maxLength='1024'
                                    placeholder='https://'
                                    onChange={e => this.onLogoChange(e, { applyFieldValue })}
                                    validateOnBlur={false}
                                />
                                <span className="input-group-label button" onClick={open}>{tt('group_settings_jsx.upload')}</span>
                            </div>)}
                        </DropZone>
                        <ErrorMessage name='logo' component='div' className='error' />
                    </div>
                </div>

                <div className='row' style={{ marginTop: '1.0rem', }}>
                    <div className='column small-12'>
                        {tt('create_group_jsx.access')}
                        <Icon name='info_o' className='icon-hint' title={tt('create_group_jsx.access_hint')} />
                        <Field
                            as='select'
                            name='privacy'
                            onChange={e => this.onPrivacyChange(e, { applyFieldValue })}
                        >
                            <option value='public_group'>{tt('create_group_jsx.access_all')}</option>
                            <option value='public_read_only'>{tt('create_group_jsx.all_read_only')}</option>
                            {values.is_encrypted && <option value='private_group'>{tt('create_group_jsx.access_private')}</option>}
                        </Field>
                        <ErrorMessage name='privacy' component='div' className='error' />
                    </div>
                </div>

                <div className='row' style={{ marginTop: '1.0rem', }}>
                    <div className='column small-12' title={tt('group_settings_jsx.encrypted_hint')}>
                        {tt('group_settings_jsx.encrypted')}
                        {values.is_encrypted ? tt('group_settings_jsx.encrypted2') : tt('group_settings_jsx.encrypted3')}
                    </div>
                </div>

                {submitError && <div style={{ marginTop: '1rem' }} className='error submit-error'>{submitError}</div>}
                <div style={{ marginTop: '1rem' }}>
                    <button className='button hollow float-right' onClick={this.closeMe}>
                        {tt('g.cancel')}
                    </button>
                    <button type='submit' disabled={disabled} className='button float-right'>
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
        uploadImage: (file, progress) => {
            dispatch({
                type: 'user/UPLOAD_IMAGE',
                payload: {file, progress},
            })
        },
        privateGroup: ({ password, creator, name, title, logo, is_encrypted, privacy,
        onSuccess, onError }) => {
            let json_metadata = {
                app: 'golos-messenger',
                version: 1,
                title,
                logo
            }
            json_metadata = JSON.stringify(json_metadata)

            const opData = {
                creator,
                name,
                json_metadata,
                is_encrypted,
                privacy,
                extensions: [],
            }

            const json = JSON.stringify(['private_group', opData])

            dispatch(transaction.actions.broadcastOperation({
                type: 'custom_json',
                operation: {
                    id: 'private_message',
                    required_auths: [creator],
                    json,
                },
                username: creator,
                password,
                successCallback: onSuccess,
                errorCallback: (err, errStr) => {
                    console.error(err)
                    if (onError) onError(err, errStr)
                },
            }));
        }
    })
)(GroupSettings)
