import React from 'react';
import PropTypes from 'prop-types';
import tt from 'counterpart';
import DropZone from 'react-dropzone';

import DialogFrame from 'app/components/dialogs/DialogFrame';
import DialogManager from 'app/components/elements/common/DialogManager';
import Input from 'app/components/elements/common/Input';
import PictureSvg from 'app/assets/icons/editor-toolbar/picture.svg';
import keyCodes from 'app/utils/keyCodes';

export default class AddImageDialog extends React.PureComponent {
    static propTypes = {
        onClose: PropTypes.func.isRequired,
    };

    componentDidMount() {
        const linkInput = document.getElementsByClassName('AddImageDialog__link-input')[0];
        if (linkInput)
            linkInput.focus();
    }

    render() {
        return (
            <DialogFrame
                className="AddImageDialog"
                title={tt('post_editor.add_image')}
                onCloseClick={this._onCloseClick}
            >
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
                            {tt('editor_toolbar.add_image_from_computer')}
                        </span>
                    </div>)}
                </DropZone>
                <div className="AddImageDialog__splitter" />
                <div>
                    <div className="AddImageDialog__link-text">
                        {tt('editor_toolbar.add_image_via_link')}:
                    </div>
                    <Input
                        block
                        className="AddImageDialog__link-input"
                        placeholder="https://"
                        onKeyDown={this._onInputKeyDown}
                    />
                </div>
            </DialogFrame>
        );
    }

    _onInputKeyDown = e => {
        if (e.which === keyCodes.ENTER) {
            e.preventDefault();
            this.props.onClose({
                url: e.target.value,
            });
        }
    };

    _onCloseClick = () => {
        this.props.onClose();
    };

    _onDrop = (acceptedFiles, rejectedFiles) => {
        const file = acceptedFiles[0];

        if (!file) {
            if (rejectedFiles.length) {
                DialogManager.alert(
                    tt('post_editor.please_insert_only_image_files')
                );
            }
            return;
        }

        this.props.onClose({ file });
    };
}
