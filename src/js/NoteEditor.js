import React, { Component } from 'react';
import { rangeArray } from './Util';

class NoteEditor extends Component {

	constructor(props) {
		console.log('construct')
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.handleFretChange = this.handleFretChange.bind(this);
        this.handleStringChange = this.handleStringChange.bind(this);
        this.handleDurationChange = this.handleDurationChange.bind(this);
		this.handleIntervalChange = this.handleIntervalChange.bind(this)
    }

    componentDidMount() {
        //console.log('mounted:', this.props);
        this.updatePosition();
        window.addEventListener("resize", this.updatePosition);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updatePosition);
    }

    componentDidUpdate(prevProps) {
        //console.log('did update, old props:', prevProps);
        //console.log('new props:', this.props);
        this.updatePosition();
    }

    updatePosition() {
        if (this.props.measureRef.current) {
            const rect = this.props.measureRef.current.getBoundingClientRect();

            const style = this.editorRef.current.style;
            style.position = 'absolute';
            style.top = rect.bottom + 'px';
            style.left = rect.left + 'px';
        }
    }

    handleFretChange(evt) {
        this.props.controller.selectedNoteModified({
            f: this.parseValue(evt)
        });
    }

    handleStringChange(evt) {        
        this.props.controller.handleChangeSelectedNoteString(this.parseValue(evt))
    }

    handleDurationChange(evt) {
        this.props.controller.selectedNoteModified({
            d: this.parseValue(evt)
        });
    }

	handleIntervalChange(evt) {
		const i = this.parseValue(evt)
        this.props.controller.selectedNoteModified({
            i: i
        });
    }

    parseValue(evt) {
        return parseInt(evt.target.value, 10)
    }

    render() {
        const note = this.props.selection.value,
			measure = note.measureObj.props.measure,
			nextNoteDist = measure.nextNoteDistanceOrRemaining(note.string, note.noteObj.p, note.note),
            nextInts = nextNoteDist * note.noteObj.i / measure.interval(),
            durations = rangeArray(1, Math.floor(nextInts) + 1, 1),
			intervals = [1, 2, 4, 8, 16].filter( i => nextNoteDist >= note.noteObj.d * measure.interval()/i ),
			availableStrings = measure.validStringsForPosition(note.noteObj.p)

		if (durations.length === 0) {
			durations.push(1)
		} 

		availableStrings.push(note.string)
		availableStrings.sort()

        //console.log('d ', nextNoteDist, durations, nextInts)
		//console.log('f', note, availableStrings)
        return (
            <div ref={this.editorRef} className="card" style={{ zIndex: 50 }} >
                <div className="card-header">
                    Note Edit
                    <button type="button" onClick={this.props.controller.clearSelectedNote} className="close" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div className="card-body">
                    <form>
                        <div className="form-row">
                            <div className="form-group">
                                <label>String</label>
                                <select id="string" className="form-control"  value={note.string} onChange={this.handleStringChange}>
                                    {availableStrings.map((str) => (
				                        <option key={str}>{str}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Interval</label>
                                <select id="interval" className="form-control" value={note.noteObj.i} onChange={this.handleIntervalChange}>
                                    {intervals.map((i) => (
                                        <option key={i}>{i}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Fret</label>
                                <select id="fret" className="form-control" value={note.noteObj.f} onChange={this.handleFretChange}>
                                    {this.props.frets.map((fret) => (
                                        <option key={fret}>{fret}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Duration</label>
                                <select id="duration" className="form-control" value={note.noteObj.d} onChange={this.handleDurationChange}>
                                    {durations.map((d) => (
                                        <option key={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

export default NoteEditor