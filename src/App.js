import React, { Component } from 'react';
import './App.css';
import tab1 from './tab.js';
import Layout from './Layout.js';
import Measure from './Measure';
import NoteEditor from './NoteEditor'

console.log(tab1);

/*
 note:
 {
	 f // fret
	 d // duration
	 i // interval
 }
 
 */
var song = {
	name: 'Name',
	author: 'Author',
	d: 4,
	i: 4,
	measures: [
		{
			strings: [
				[{f: 1, d:1, i:4, p: 2}],
				[],
				[{f: 7, d:1, i:4, p: 3}],
				[],
				[],
				[]
			]
		},
		{
			strings: [
				[],
				[{f: 13, d:1, i:8, p: 1}],
				[],
				[{f: 4, d:1, i:4, p: 0}],
				[],
				[]
			]
		},
		{
			strings: [
				[],
				[{f: 13, d:1, i:16, p: 1}],
				[],
				[{f: 5, d:1, i:4, p: 0}],
				[{f: 14, d:1, i:8, p: 0.5}],
				[{f: 8, d:1, i:16, p: 1.25}]
			]
		}
	]
};

var layout = new Layout();





class App extends Component {
	constructor(props) {
		super(props);
		
        this.measureIndex = this.processSong(song);
		
		this.state = {
			song: song,
			layout: layout,
            selectedMeasure: {},
            selectedNote: {},
            locked: false
		};

        this.measureRef = React.createRef();

        const fretCount = 24;
        this.frets = [];
        for (let i = 0; i < fretCount; i++) {
            this.frets.push(i);
        }

        this.handleMeasureSelect = this.handleMeasureSelect.bind(this);
        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleNoteClick = this.handleNoteClick.bind(this);
        this.clearSelectedMeasure = this.clearSelectedMeasure.bind(this);
        this.clearSelectedNote = this.clearSelectedNote.bind(this);
        this.handleChangeSelectedNoteString = this.handleChangeSelectedNoteString.bind(this);
        this.handleLock = this.handleLock.bind(this);
        this.handleDrag = this.handleDrag.bind(this);
	}
	
	processSong(song) {
		var i = 1;
		for (var m = 0; m < song.measures.length; m++) {
			song.measures[m].key = i++;
		}
		
		return i;
	}
	
    handleMeasureSelect(measure) {
        console.log('click ' + Object.keys(measure.state));
		
		this.setState(prevState => ({
            selectedMeasure: measure.props.measure
		}));
	}

    clearSelectedMeasure() {
        console.log('clearSelectedMeasure ' )
        this.setState({ selectedMeasure: {} });
    }

    clearSelectedNote() {
        console.log('selectedNote ')
        this.setState({ selectedNote: {} });
    }

    handleChangeSelectedNoteString(string) {
        const measure = this.state.selectedNote.measureObj,
            removed = measure.removeNote(this.state.selectedNote.string, this.state.selectedNote.note),
            note = removed[0],
            idx = measure.addNote(string, note)

        this.setState({
            song: this.state.song
        })

        this.setSelectedNote(measure, string, idx)
    }

    findMeasureIndex(measure) {
        return this.state.song.measures.findIndex(x => x.key === measure.key);
    }

    newMeasure() {
        const strings = [];

        for (var m = 0; m < 6; m++) {
            strings.push([]);
        }

        return {
            key: this.measureIndex++,
            strings: strings
        };
    }

    insertNewBeforeSelectedMeasure() {
        const idx = this.findMeasureIndex(this.state.selectedMeasure);
        const strings = [];

        for (let m = 0; m < 6; m++) {
            strings.push([]);
        }

        const m = this.newMeasure();

        this.state.song.measures.splice(idx, 0, m);
        this.setState(prevState => ({
            song: this.state.song
        }));
    }

    handleNoteClick(measure, stringIndex, noteIndex, e) {
        console.log('handleNoteClick ', noteIndex, stringIndex, measure.props.measure.key);
        this.setSelectedNote(measure, stringIndex, noteIndex);
    }

    handleStringClick(measure, stringIndex, e) {
        if (this.state.locked) return

        const bound = e.target.getBoundingClientRect(),
            x = e.clientX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistanceOrRemaining(stringIndex, pos);

        console.log('handleStringClick ', stringIndex, x, w, pos, dist);

        if (dist !== 0) {
            // doing calcs in larger values and then simplifying to avoid fractions
            const dur = Math.min(dist, 1) * measure.state.subdivisions,
                int = measure.props.interval * measure.state.subdivisions

            console.log('dur ', dur, ' dist ', dist, measure.state.subdivisions * Math.min(dist, 1)  );

            const note = {
                p: pos, d: dur, f: 0, i: int
            }
            this.simplifyNoteTiming(note);

            console.log(' str ', int, note)

            const idx = measure.addNote(stringIndex, note)

            this.setState({
                song: this.state.song
            })

            this.setSelectedNote(measure, stringIndex, idx)
        }
        
    }

    simplifyNoteTiming(note) {
        while (note.d % 2 === 0 && note.i % 2 === 0) {
            note.d /= 2
            note.i /= 2
        }
    }

    

    setSelectedNote(measure, stringIndex, noteIndex) {
        const noteObj = measure.props.measure.strings[stringIndex][noteIndex],
            availableStrings = measure.validStringsForPosition(noteObj.p)

        availableStrings.push(stringIndex)
        availableStrings.sort()
        //console.log(' av ', availableStrings, noteObj)

        this.setState({
            selectedNote: {
                measure: measure.props.measure.key,
                string: stringIndex,
                note: noteIndex,
                noteObj: noteObj,
                measureObj: measure,
                availableStrings: availableStrings
            },
        });
    }

    selectedNoteModified(change) {
        const selNote = this.state.selectedNote;
        Object.keys(change).forEach(k => selNote.noteObj[k] = change[k])

        console.log('selectedNoteModified ', this.state.selectedNote.noteObj)
        this.setState({
            song: this.state.song
        })
    }

    measureNeedsRef(measure) {
        const hasSelectedNote = this.state.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.state.selectedMeasure.key !== undefined;

        if (hasSelectedNote) {
            return measure.key === this.state.selectedNote.measure;
        } else if (hasSelectedMeasure) {
            return measure.key === this.state.selectedMeasure.key;
        } else {
            return false;
        }
    }

    handleLock() {
        console.log('lock')
        this.setState(prevState => ({
            locked: !prevState.locked
        }));
    }

    handleDrag(evt) {
        console.log('drag')
    }

    render() {
        const hasSelectedNote = this.state.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.state.selectedMeasure.key !== undefined;

    //    console.log('selnote: ', this.state.selectedNote);
     //   console.log('layout2 ', this.state.layout);
    return (
        <React.Fragment>

          <nav className="navbar navbar-expand-sm navbar-dark bg-dark">
                <a className="navbar-brand" href="#">Tabulater</a>

                <div className="collapse navbar-collapse" id="navbarSupportedContent">
                    <ul className="navbar-nav mr-auto">
                        <li className="nav-item active">
                            <a className="nav-link" href="#">Home <span className="sr-only">(current)</span></a>
                        </li>
                        <li className="nav-item">
                            <a className="nav-link" onClick={this.handleLock} ><span className={"fa fa-lock" + (this.state.locked ? ' text-info' : '')} ></span></a>
                        </li>
                    </ul>
                </div>
          </nav>
            <div className="container" style={{ "marginTop": "1em" }}>
		<h4>{this.state.song.name}</h4>
		<h6>{this.state.song.author}</h6>
		
                {this.state.song.measures.map((measure, idx) => !this.measureNeedsRef(measure) ?

                    <Measure key={measure.key} measure={measure} layout={this.state.layout} duration={measure.d || this.state.song.d} interval={measure.i || this.state.song.i}
                        onMeasureSelect={this.handleMeasureSelect} selected={false} onStringClick={this.handleStringClick} onNoteClick={this.handleNoteClick} onNoteDragStart={this.handleDrag} />
                    :

                    <Measure key={measure.key} forwardedRef={this.measureRef} measure={measure} layout={this.state.layout} duration={measure.d || this.state.song.d} interval={measure.i || this.state.song.i}
                        onMeasureSelect={this.handleMeasureSelect} selected={measure.key === this.state.selectedMeasure.key} onStringClick={this.handleStringClick} onNoteClick={this.handleNoteClick} selectedNote={this.state.selectedNote}
                        onNoteDragStart={this.handleDrag} />
                )}

                {hasSelectedMeasure ? <MeasureEditor measureRef={this.measureRef} measure={this.state.selectedMeasure} controller={this} /> : ''}
                {hasSelectedNote ? <NoteEditor measureRef={this.measureRef} note={this.state.selectedNote} controller={this} frets={this.frets} /> : ''}

            </div>

            <span draggable="true" onDragStart={this.handleDrag} >Hi</span>
            </React.Fragment>
    );
  }
}


class MeasureEditor extends Component {

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.insertBefore = this.insertBefore.bind(this);
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        this.updatePosition();
        window.addEventListener("resize", this.updatePosition);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updatePosition);
    }

    componentDidUpdate(prevProps) {
        console.log('did update, old props:', prevProps);
        console.log('new props:', this.props);
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
        this.props.controller.insertNewBeforeSelectedMeasure();
    }

    render() {

        return (
            <div ref={this.editorRef} className="measure-edit-panel panel panel-primary" >
                <div className="panel-body form-inline">
                    <form>
                        <button type="button" className="close pull-right" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="form-group">
                            <label>Insert Empty</label>
                            <button type="button" onClick={this.insertBefore} className="btn btn-default" aria-label="">
                                <span aria-hidden="true">Before</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}



export { App, Measure };
