import React, { Component } from 'react';
import { ModalDialog } from './BaseBoot'


class SettingsEditor extends Component {

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.handleClose = this.handleClose.bind(this);
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        //this.updatePosition();
        // window.addEventListener("resize", this.updatePosition);
    }

    componentWillUnmount() {
        //window.removeEventListener("resize", this.updatePosition);
    }

    componentDidUpdate(prevProps) {
        console.log('did update, old props:', prevProps);
        console.log('new props:', this.props);
        //this.updatePosition();
    }

    updatePosition() {
        if (this.props.measureRef.current) {
            const rect = this.props.measureRef.current.getBoundingClientRect();
            console.log(rect.top, rect.right, rect.bottom, rect.left);

            const style = this.editorRef.current.style;
            style.position = 'absolute';
            style.top = rect.bottom + 'px';
            style.left = rect.left + 'px';
        }
    }

    handleClose() {
        this.props.controller.toggleShowSettings()
    }

    render() {

        return (
            <ModalDialog title="Tabulater Settings" onClose={this.handleClose} >
                <form>
                    <div className="form-group">
                        <label>Setting</label>

                    </div>
                </form>
            </ModalDialog>
        )
    }
}

class FileLoader extends Component {

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();

        this.handleFileChanged = this.handleFileChanged.bind(this);
        this.handleClose = this.handleClose.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        // $(this.editorRef.current).modal('show')
        //document.body.classList.add('modal-open')
    }

    componentWillUnmount() {
        console.log('unmounting')
        //document.body.classList.remove('modal-open')
    }

    componentDidUpdate(prevProps) {
        console.log('did update')
    }

    handleFileChanged() {

    }

    handleClose() {
        this.props.controller.toggleShowLoadFile();
    }

    handleSubmit(evt) {
        console.log('handling submit', this.fileInput.files)

        evt.preventDefault()

        if (this.fileInput.files[0]) {
            const rdr = new FileReader()
            rdr.onload = loadEvt => {
                console.log('loaded', this.props)
                const result = loadEvt.target.result

                try {
                    const obj = JSON.parse(result)

                    this.props.controller.loadSong(obj)
                } catch (e) {
                    console.log('error parsing', e)
                }
            }
            rdr.onerror = errEvt => {
                console.log('error')
            }

            rdr.readAsText(this.fileInput.files[0])
        }
    }

    render() {

        return (
            <ModalDialog title="Load Song" onClose={this.handleClose} >
                <form onSubmit={this.handleSubmit}>
                    <div className="form-group">
                        <input type="file" ref={input => this.fileInput = input} />
                    </div>
                    <button type="submit" className="btn btn-primary">Upload</button>
                </form>
            </ModalDialog>
        )
    }
}




class SaveDialog extends Component {

    constructor(props) {
        super(props);
        this.handleClose = this.handleClose.bind(this);
    }

    handleClose() {
        this.props.controller.toggleShowSaveFile();
    }

    render() {

        return (
            <ModalDialog title="Save Song" onClose={this.handleClose} >
                <form>
                    <textarea cols="50" rows="10" readOnly value={JSON.stringify(this.props.controller.state.song.export())}>

                    </textarea>
                </form>
            </ModalDialog>
        )
    }
}

export { FileLoader, SaveDialog, SettingsEditor }