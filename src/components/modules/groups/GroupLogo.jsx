import React from 'react'
import DropZone from 'react-dropzone'
import { connect } from 'react-redux'
import { Field, ErrorMessage, } from 'formik'
import tt from 'counterpart'

import Input from 'app/components/elements/common/Input';
import PictureSvg from 'app/assets/icons/editor-toolbar/picture.svg';
import DialogManager from 'app/components/elements/common/DialogManager'

class GroupLogo extends React.Component {
    state = {}

    constructor(props) {
        super(props)
    }

    uploadLogo = (file, name, setFieldValue) => {
        const { notify } = this.props
        const { uploadImage } = this.props
        this.setState({ uploading: true })
        uploadImage(file, progress => {
            if (progress.url) {
                alert(progress.url)
            }
            if (progress.error) {
                const { error } = progress;
                notify(error, 10000)
            }
            this.setState({ uploading: false })
        })
    }

    _onDrop = (acceptedFiles, rejectedFiles, setFieldValue) => {
        const file = acceptedFiles[0]

        if (!file) {
            if (rejectedFiles.length) {
                DialogManager.alert(
                    tt('post_editor.please_insert_only_image_files')
                )
            }
            return
        }

        this.uploadLogo(file, file.name, setFieldValue)
    };

    _onInputKeyDown = e => {
        if (e.which === keyCodes.ENTER) {
            e.preventDefault();
            //this.props.onClose({
                //e.target.value,
            //});
        }
    };


    render() {
        const { values, setFieldValue, setFieldTouched } = this.props
        const { uploading } = this.state

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
                        accept="image/*"
                        onDrop={this._onDrop}
                    >
                        {({getRootProps, getInputProps}) => (<div className="AddImageDialog__drop-zone" {...getRootProps()}>
                            <input {...getInputProps()} />
                            <i
                                className="AddImageDialog__drop-zone-icon"
                                dangerouslySetInnerHTML={{ __html: PictureSvg }}
                            />
                            <span className="AddImageDialog__drop-zone-text">
                                {tt('create_group_jsx.logo_upload')}
                            </span>
                        </div>)}
                    </DropZone>
                    <div className="AddImageDialog__splitter" />
                    <div>
                        <div className="AddImageDialog__link-text">
                            {tt('create_group_jsx.logo_link')}:
                        </div>
                        <Field name='logo' type='text'
                            placeholder='https://'
                        >
                            {({ field, form }) => <Input
                                block
                                className="AddImageDialog__link-input"
                                autoFocus
                                onKeyDown={this._onInputKeyDown}
                            />}
                        </Field>
                    </div>
                </div>
            </div>
        </React.Fragment>
    }
}

export default connect(
    // mapStateToProps
    (state, ownProps) => {
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
