import React, { Component } from 'react';

class MeasureEditor extends Component {

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.insertBefore = this.insertBefore.bind(this);
		this.insertAfter = this.insertAfter.bind(this)
    }

    componentDidMount() {
        this.updatePosition();
        window.addEventListener("resize", this.updatePosition);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updatePosition);
    }

    componentDidUpdate(prevProps) {
        this.updatePosition();
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

    insertBefore() {
        this.props.controller.insertNewOffsetFromSelectedMeasure();
    }
	
	insertAfter() {
        this.props.controller.insertNewOffsetFromSelectedMeasure(1);
    }

    render() {

        return (
            <div ref={this.editorRef} className="card" style={{ zIndex: 50 }} >
                <div className="card-header">
                    Measure Edit
                    <button type="button" onClick={this.props.controller.clearSelectedMeasure} className="close" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="card-body">
                    <form>
                        <div className="form-group">
                            <label>Insert Empty</label>
							<div>
								<button type="button" onClick={this.insertBefore} className="btn btn-default btn-secondary mx-2" aria-label="">
									<span aria-hidden="true">Before</span>
								</button>
                                <button type="button" onClick={this.insertAfter} className="btn btn-default btn-secondary mx-2" aria-label="">
									<span aria-hidden="true">After</span>
								</button>
							</div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}


export default MeasureEditor