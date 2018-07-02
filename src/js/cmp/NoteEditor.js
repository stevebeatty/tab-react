import React, { Component } from 'react';
import { rangeArray } from 'js/util/Util';

class NoteEditor extends Component {

	constructor(props) {
		//console.log('construct')
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.handleFretChange = this.handleFretChange.bind(this);
        this.handleStringChange = this.handleStringChange.bind(this);
        this.handleDurationChange = this.handleDurationChange.bind(this);
        this.handleIntervalChange = this.handleIntervalChange.bind(this)
        this.handleContinuedByChange = this.handleContinuedByChange.bind(this)
        this.handleDeleteNote = this.handleDeleteNote.bind(this)
        this.handleEffectChange = this.handleEffectChange.bind(this)
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

            const style = this.editorRef.current.style;
            style.position = 'absolute';
            style.top = rect.bottom + 'px';
            style.left = rect.left + 'px';
        }
    }

    selectedNoteModified(change) {
        const selNote = this.props.selection.value
        console.log('selectedNoteModified ', selNote)
        Object.keys(change).forEach(k => selNote.note[k] = change[k])

        this.props.controller.handleSongUpdated()
    }

    parseValue(evt) {
        return parseInt(evt.target.value, 10)
    }

    handleFretChange(evt) {
        this.selectedNoteModified({ f: this.parseValue(evt) })
    }

    handleStringChange(evt) {        
        this.props.controller.handleChangeSelectedNoteString(this.parseValue(evt))
    }

    handleDurationChange(evt) {
        this.selectedNoteModified({ d: this.parseValue(evt) })
    }

	handleIntervalChange(evt) {
        this.selectedNoteModified({ i: this.parseValue(evt) })
    }

    handleEffectChange(evt) {
		const value = evt.target.value,
			selNote = this.props.selection.value

		if (value === 'none') {
			delete selNote.note.effect
		} else {
			selNote.note.effect = value
		}

        this.props.controller.handleSongUpdated()
    }

    handleContinuedByChange(evt, continuedNote) {
        //const continuedBy = this.parseValue(val)
        console.log('evt', evt.target.value, continuedNote)
        if (continuedNote) {
            const note = this.props.selection.value.note
            note.continuedBy = continuedNote.key
            continuedNote.continues = note.key
        }

        this.props.controller.handleSongUpdated()
    }

    handleDeleteNote() {
        const note = this.props.selection.value,
			song = this.props.song,
			measureIndex = song.measureIndexWithKey(note.measure.key)

        song.removeNoteByIndex(measureIndex, note.string, note.noteIndex)
        this.props.controller.clearSelectedNote()
        this.props.controller.handleSongUpdated()
    }

    calculateNoteSettings(note) {
        const measure = note.measure,
            measureDur = measure.duration(),
            noteLen = measure.noteLength(note.note),
            nextNoteDist = measure.nextNoteDistance(note.string, note.note.p, note.note.key),
            availableSpace = nextNoteDist === -1 ? measureDur - note.note.p : nextNoteDist,
            nextInts = availableSpace * note.note.i / measure.interval(),
            durations = rangeArray(1, Math.floor(nextInts) + 1, 1),
            intervals = [1, 2, 4, 8, 16].filter(i => availableSpace >= note.note.d * measure.interval() / i)

        if (durations.length === 0) {
            durations.push(1)
        }

        let canContinue = false, continuedNote = null
        if (nextNoteDist - noteLen === 0) {
            canContinue = true
            continuedNote = measure.strings[note.string][note.noteIndex + 1]
            console.log('can continue')
        } else if (measureDur - note.note.p - noteLen === 0) {
            const next = this.props.song.measureAfter(measure.key),
                nextMeasNoteDist = next ? next.nextNoteDistance(note.string, 0) : -1

            canContinue = nextMeasNoteDist === 0
            if (canContinue) {
                continuedNote = next.strings[note.string][0]
            }
            console.log('check next', nextMeasNoteDist)
        }

        const isContinuation = 'continuedBy' in note.note 

        return {
            durations,
            intervals,
            canContinue,
            continuedNote,
            isContinuation
        }
    }
    

    render() {
        const value = this.props.selection.value,
            hasMultipleSelections = Array.isArray(value),
            note = hasMultipleSelections ? value[0] : value

        const settings = this.calculateNoteSettings(note)

        console.log('note.key', note.note.key)

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
                        <div className="form-row align-items-center">
                            <div className="col-auto">
                                <label>Duration</label>
                                <select id="duration" className="form-control" value={note.note.d} onChange={this.handleDurationChange}>
                                    {settings.durations.map((d) => (
                                        <option key={d}>{d}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-auto">
                                <label>Interval</label>
                                <select id="interval" className="form-control" value={note.note.i} onChange={this.handleIntervalChange}>
                                    {settings.intervals.map((i) => (
                                        <option key={i}>{i}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-auto">
                                <label>Fret</label>
                                <select id="fret" className="form-control" value={note.note.f} onChange={this.handleFretChange}>
                                    {this.props.frets.map((fret) => (
                                        <option key={fret}>{fret}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="col-auto">
                                <label>Effect</label>
                                <select id="effect" className="form-control" value={note.note.effect} onChange={this.handleEffectChange}>
                                    <option key={0}>none</option>
                                    <option key={1}>vibrato</option>
                                    <option key={2}>bend</option>
                                    <option key={3}>pre-bend</option>
                                    <option key={4}>slide-up</option>
                                    <option key={5}>slide-down</option>
                                    <option key={6}>hammer-on</option>
                                    <option key={7}>pull-off</option>
                                    <option key={8}>harmonic</option>
                                </select>
                            </div>
                            <div className="col-auto">
                                <div className="form-check">
                                    <input type="checkbox" checked={settings.isContinuation} disabled={!settings.canContinue} onChange={(e) => this.handleContinuedByChange(e, settings.continuedNote)} className="form-check-input" id="customCheck1" />
                                    <label className="form-check-label" htmlFor="customCheck1">Continue Note?</label>
                                </div>
                            </div>
                            <button type="button" className="btn btn-secondary my-2" onClick={this.handleDeleteNote}>Delete</button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

export default NoteEditor