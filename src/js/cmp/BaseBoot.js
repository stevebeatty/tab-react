import React, { Component } from 'react';

class NavBar extends Component {

    constructor(props) {
        super(props);
    }

    render() {

        return (
            <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
                <a className="navbar-brand" href="#">{this.props.brand}</a>

                <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto">

                        {this.props.children.map((child, idx) =>
                            <li key={idx} className="nav-item">{child}</li>
                        )}


                    </ul>
                </div>
            </nav>
        )
    }
}


class ModalDialog extends Component {

    constructor(props) {
        super(props);
        this.dialogRef = React.createRef();

        this.handleClick = this.handleClick.bind(this)
        this.handleClickDialog = this.handleClickDialog.bind(this)
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        document.body.classList.add('modal-open')
    }

    componentWillUnmount() {
        console.log('unmounting')
        document.body.classList.remove('modal-open')
    }

    handleClick(evt) {
        console.log('handleClick')
        this.props.onClose()
    }

    handleClickDialog(evt) {
        console.log('handleClickDialog')
        evt.stopPropagation()
    }

    render() {

        return (
            <React.Fragment>
                <div ref={this.dialogRef} className="modal show" tabIndex="-1" role="dialog" style={{ display: 'block' }} onClick={this.handleClick}>
                    <div className="modal-dialog" role="document" onClick={this.handleClickDialog}>
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.props.title}</h5>
                                <button onClick={this.props.onClose} type="button" className="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <div className="modal-body">
                                {this.props.children}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="modal-backdrop show"></div>
            </React.Fragment>
        )
    }
}


export { NavBar, ModalDialog };