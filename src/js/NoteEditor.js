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
        this.handleContinuedByChange = this.handleContinuedByChange.bind(this)
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
        })
    }

    handleStringChange(evt) {        
        this.props.controller.handleChangeSelectedNoteString(this.parseValue(evt))
    }

    handleDurationChange(evt) {
        this.props.controller.selectedNoteModified({
            d: this.parseValue(evt)
        })
    }

	handleIntervalChange(evt) {
		const i = this.parseValue(evt)
        this.props.controller.selectedNoteModified({
            i: i
        })
    }

    handleContinuedByChange(evt, continuedNote) {
        //const continuedBy = this.parseValue(val)
        console.log('evt', evt.target.value, continuedNote)
        if (continuedNote) {
            const note = this.props.selection.value.noteObj
            note.continuedBy = continuedNote.key
            continuedNote.continues = note.key
        }

        this.props.controller.handleSongUpdated()
    }

    parseValue(evt) {
        return parseInt(evt.target.value, 10)
    }

    render() {
        const note = this.props.selection.value,
            measure = note.measureObj.props.measure,
            measureDur = measure.duration(),
            noteLen = measure.noteLength(note.noteObj),
            nextNoteDist = measure.nextNoteDistance(note.string, note.noteObj.p, note.note),
            availableSpace = nextNoteDist === -1 ? measureDur - note.noteObj.p : nextNoteDist,
            nextInts = availableSpace * note.noteObj.i / measure.interval(),
            durations = rangeArray(1, Math.floor(nextInts) + 1, 1),
            intervals = [1, 2, 4, 8, 16].filter(i => availableSpace >= note.noteObj.d * measure.interval()/i ),
			availableStrings = measure.validStringsForPosition(note.noteObj.p)

		if (durations.length === 0) {
			durations.push(1)
        }
        console.log('ne', note.noteObj, nextNoteDist, availableSpace, noteLen)
		availableStrings.push(note.string)
        availableStrings.sort()

        let canContinue = false, continuedNote = null
        if (nextNoteDist - noteLen === 0) {
            canContinue = true
            continuedNote = measure.strings[note.string][note.note + 1]
            console.log('can continue')
        } else if (measureDur - note.noteObj.p - noteLen === 0) {
            const next = this.props.song.measureAfter(measure.key),
                nextMeasNoteDist = next ? next.nextNoteDistance(note.string, 0) : -1

            canContinue = nextMeasNoteDist === 0
            if (canContinue) {
                continuedNote = next.strings[note.string][0]
            }
            console.log('check next', nextMeasNoteDist)
        }

        const isContinuation = 'continuedBy' in note.noteObj 

        //console.log('d ', nextNoteDist, durations, nextInts)
        console.log('cn', continuedNote)
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
                            <div className="form-group">
                                <label>Continue?</label>
                                <div className="form-check">
                                    <input type="checkbox" checked={isContinuation} onChange={(e) => this.handleContinuedByChange(e, continuedNote)} className="form-check-input" id="customCheck1" />
                                    <label class="form-check-label" for="customCheck1">Continue?</label>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

export default NoteEditor