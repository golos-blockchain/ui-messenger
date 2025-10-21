import React from 'react'
import DropZone from 'react-dropzone'
import { connect } from 'react-redux'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'

import Input from 'app/components/elements/common/Input';
import PictureSvg from 'app/assets/icons/editor-toolbar/picture.svg?raw';
import DialogManager from 'app/components/elements/common/DialogManager'
import LoadingIndicator from 'app/components/elements/LoadingIndicator'
import { delay } from 'app/utils/misc'
import { proxifyImageUrlWithStrip } from 'app/utils/ProxifyUrl';

export async function validateLogoStep(values, errors) {
    if (values.logo) {
        try {
            let previewRes
            const img = document.createElement('img')
            const uniq =  Math.random()
            window._logoValidator = uniq

            img.onload = () => {
                console.log('img onload')
                previewRes = { ok: true }
            }
            img.onerror = () => {
                console.log('img onerror')
                previewRes = { err: 'wrong' }
            }
            img.src = values.logo

            const started = Date.now()
            const checkTimeout = 7000
            while (true) {
                const elapsed = Date.now() - started

                if (window._logoValidator !== uniq) { // Another loop started
                    console.log('ret', uniq)
                    return
                }

                if (!previewRes && elapsed > checkTimeout) {
                    errors.logo = tt('create_group_jsx.image_timeout')
                    return
                }

                if (previewRes) {
                    if (previewRes.err) {
                        errors.logo = tt('create_group_jsx.image_wrong')
                        return
                    } else {
                        return
                    }
                }

                await delay(100)
            }
        } catch (err) {
            console.error(err)
            errors.logo = 'Unknown validation error'
        }
    }
}

class GroupLogo extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    uploadLogo = (file, name) => {
        const { notify, uploadImage, applyFieldValue } = this.props
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

    onDrop = (acceptedFiles, rejectedFiles) => {
        const file = acceptedFiles[0]

        if (!file) {
            if (rejectedFiles.length) {
                DialogManager.alert(
                    tt('post_editor.please_insert_only_image_files')
                )
            }
            return
        }

        this.uploadLogo(file, file.name)
    };

    onInputKeyDown = e => {
        if (e.which === keyCodes.ENTER) {
            e.preventDefault();
            //this.props.onClose({
                //e.target.value,
            //});
        }
    };

    onChange = (e) => {
        const { applyFieldValue} = this.props
        applyFieldValue('logo', e.target.value)
    }

    _renderPreview = () => {
        const { values, errors, isValidating } = this.props
        let { logo } = values
        if (isValidating) {
            return <div className='image-loader'>
                <LoadingIndicator type='circle' />
            </div>
        } else if (logo && !errors.logo) {
            const size = '75x75' // main size of Userpic
            logo = proxifyImageUrlWithStrip(logo, size);
            return <img src={logo} className='image-preview' />
        }
        return null
    }

    render() {
        const { isValidating } = this.props
        const { uploading, } = this.state

        const selectorStyleCover = uploading ?
            {
                whiteSpace: `nowrap`,
                display: `flex`,
                alignItems: `center`,
                padding: `0 6px`,
                pointerEvents: `none`,
                cursor: `default`,
                opacity: `0.6`
            } :
            {
                display: `flex`,
                alignItems: `center`,
                padding: `0 6px`
            }

        return <React.Fragment>
            <div className='row' style={{ marginTop: '0rem' }}>
                <div className='column small-12' style={{paddingTop: 5, fontSize: '110%'}}>
                    {tt('create_group_jsx.logo_desc')}
                </div>
            </div>
            <div className='row' style={{ marginTop: '0.5rem', marginBottom: '2rem' }}>
                <div className='AddImageDialog column small-12' style={{paddingTop: 5}}>
                    <DropZone
                        multiple={false}
                        accept='image/*'
                        onDrop={(af, rf) => this.onDrop(af, rf)}
                    >
                        {({getRootProps, getInputProps}) => (<div className='AddImageDialog__drop-zone' {...getRootProps()}>
                            <input {...getInputProps()} />
                            <i
                                className='AddImageDialog__drop-zone-icon'
                                dangerouslySetInnerHTML={{ __html: PictureSvg }}
                            />
                            <span className='AddImageDialog__drop-zone-text'>
                                {tt('create_group_jsx.logo_upload')}
                            </span>
                        </div>)}
                    </DropZone>
                    <div className='AddImageDialog__splitter' />
                    <div>
                        <div className='AddImageDialog__link-text'>
                            {tt('create_group_jsx.logo_link')}:
                        </div>
                        <Field name='logo'
                            block
                            as={Input}
                            placeholder='https://'
                            autoFocus
                            className='AddImageDialog__link-input'
                            onChange={e => this.onChange(e)}
                        >
                        </Field>
                        {!isValidating && <ErrorMessage name='logo' component='div' className='error' />}
                    </div>
                    {this._renderPreview()}
                </div>
            </div>
        </React.Fragment>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
        return {
            ...ownProps
        }
    },
    dispatch => ({
        uploadImage: (file, progress) => {
            dispatch({
                type: 'user/UPLOAD_IMAGE',
                payload: {file, progress},
            })
        },
        notify: (message, dismiss = 3000) => {
            dispatch({type: 'ADD_NOTIFICATION', payload: {
                key: 'group_logo_' + Date.now(),
                message,
                dismissAfter: dismiss}
            });
        }
    })
)(GroupLogo)
