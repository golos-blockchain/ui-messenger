import React from 'react'
import tt from 'counterpart'
import { Formik, Field } from 'formik'

import BackButtonController from 'app/components/elements/app/BackButtonController'
import Icon from 'app/components/elements/Icon'

class AppSettings extends React.Component {
    makeInitialValues() {
        let initialValues = {
            current_node: $GLS_Config.current_node,
            img_proxy_prefix: $GLS_Config.images.img_proxy_prefix,
            use_img_proxy: $GLS_Config.images.use_img_proxy,
            auth_service: $GLS_Config.auth_service.host,
            notify_service: $GLS_Config.notify_service.host,
            blogs_service: $GLS_Config.blogs_service.host,
        }
        this.initialValues = initialValues
    }

    constructor(props) {
        super(props)
        this.makeInitialValues()
    }

    _renderNodes() {
        let fields = []
        for (let i in $GLS_Config.nodes) {
            let pair = $GLS_Config.nodes[i]
            let { address, } = pair
            fields.push(
                <div style={{ display: 'block' }}>
                    <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                        <Field name='current_node'
                            type='radio'
                            value={address}
                        />
                        {address}
                    </label>
                </div>
            )
        }
        fields.push(
            <div style={{ display: 'block' }}>
                <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                    <Field name='current_node'
                        type='radio'
                        value={'custom'}
                    />
                    <Field name='custom_address'
                        type='text'
                        autoComplete='off'
                        style={{ width: '300px', display: 'inline-block' }}
                    />
                </label>
            </div>
        )
        return fields
    }

    _onSubmit = (data) => {
        let cfg = { ...$GLS_Config }
        if (data.custom_address) {
            const exists = cfg.nodes.find(item => item.address === data.custom_address)
            if (!exists) {
                cfg.nodes.push({
                    address: data.custom_address
                })
            }
        }
        if (data.current_node === 'custom') {
            cfg.current_node = data.custom_address
        } else {
            cfg.current_node = data.current_node
        }
        cfg.images.img_proxy_prefix = data.img_proxy_prefix
        cfg.images.use_img_proxy = data.use_img_proxy
        cfg.auth_service.host = data.auth_service
        cfg.notify_service.host = data.notify_service
        cfg.blogs_service.host = data.blogs_service
        cfg = JSON.stringify(cfg)
        localStorage.setItem('app_settings', cfg)

        window.location.href = '/'
    }

    render() {
        return <div>
            <BackButtonController handle={() => window.location.href = '/'} />
            <div className='row'>
                <div className='column small-12'>
                    <h1 style={{ marginTop: '1rem' }}>
                        <a href='/'>
                            <Icon name='chevron-left' />
                        </a>
                        <span style={{ marginLeft: '1rem', paddingTop: '0.5rem' }}>
                            {tt('g.settings')}
                        </span>
                    </h1>
                </div>
            </div>
            <div className='secondary' style={{ paddingLeft: '0.625rem', marginBottom: '0.25rem' }}>
                {tt('app_settings.to_save_click_button')}
            </div>
            <Formik
                initialValues={this.initialValues}
                onSubmit={this._onSubmit}
            >
                {({
                    handleSubmit, isSubmitting, errors, values, handleChange,
                }) => (
                <form
                    onSubmit={handleSubmit}
                    autoComplete='off'
                >
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.current_node')}
                            <div style={{marginBottom: '1.25rem'}}>
                                {this._renderNodes()}
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            <label style={{ textTransform: 'none', color: 'inherit', fontSize: 'inherit' }}>
                                <Field
                                    name={`use_img_proxy`}
                                    type='checkbox'
                                    className='input-group-field bold'
                                />
                                {tt('app_settings.img_proxy_prefix')}
                            </label>
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='img_proxy_prefix'
                                    disabled={!values.use_img_proxy}
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.auth_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='auth_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.notify_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='notify_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='column small-12' style={{paddingTop: 5}}>
                            {tt('app_settings.blogs_service')}
                            <div className='input-group' style={{marginBottom: '1.25rem'}}>
                                <Field name='blogs_service'
                                    type='text'
                                    autoComplete='off'
                                />
                            </div>
                        </div>
                    </div>
                    <div className='row' style={{marginTop: 15}}>
                        <div className='small-12 columns'>
                            <div>
                                <button type='submit' className='button'>
                                    {tt('app_settings.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            )}</Formik>
        </div>
    }
}

export default AppSettings

export function openAppSettings() {
    const reload = window.location.pathname === '/'
    window.location.href = '/#app-settings'
    if (reload)
        window.location.reload()
}
