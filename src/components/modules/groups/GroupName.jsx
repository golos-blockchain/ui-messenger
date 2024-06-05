import React from 'react'
import { Field, ErrorMessage, } from 'formik'
import getSlug from 'speakingurl'
import tt from 'counterpart'
import { api } from 'golos-lib-js'

import Icon from 'app/components/elements/Icon'

export async function validateNameStep(values, errors, setValidating) {
    if (!values.title) {
        errors.title = tt('g.required')
    }
    if (values.name) {
        if (values.name.length < 3) {
            errors.name = tt('create_group_jsx.group_min_length')
        } else {
            setValidating(true)
            let group
            for (let i = 0; i < 3; ++i) {
                try {
                    console.time('group_exists')
                    group = await api.getGroupsAsync({
                        start_group: values.name,
                        limit: 1
                    })
                    console.timeEnd('group_exists')
                    break
                } catch (err) {
                    console.error(err)
                    errors.name = 'Blockchain unavailable :('
                }
            }
            if (group && group[0]) {
                errors.name = tt('create_group_jsx.group_already_exists')
            }
            setValidating(false)
        }
    }
}

export default class GroupName extends React.Component {
    state = {}

    constructor(props) {
        super(props)
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
        for (let i = 0; i < value.length; ++i) {
            const c = value[i]
            const is_alpha = c >= 'a' && c <= 'z'
            const is_digit = c >= '0' && c <= '9'
            const is_dash = c == '-'
            const is_ul = c == '_'
            if (i == 0) {
                if (!is_alpha && !is_digit) return;
            } else {
                if (!is_alpha && !is_digit && !is_dash && !is_ul) return;
            }
        }
        setFieldValue('name', value)
    }

    onPrivacyChange = (e, setFieldValue) => {
        setFieldValue('privacy', e.target.value)
        setFieldValue('is_encrypted', true)
    }

    render() {
        const { values, setFieldValue, setFieldTouched } = this.props
        const { showName } = this.state
        return <React.Fragment>
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
        </React.Fragment>
    }
}
