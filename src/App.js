import React, { Component } from 'react';
import './App.css';
import tab1 from './tab.js';
import Layout from './Layout.js';
import MeasureDisplay from './MeasureDisplay';
import NoteEditor from './NoteEditor'
import { Song, Measure } from './Model'
import $ from 'jquery'

console.log(tab1);

/*
 note:
 {
	 f // fret
	 d // duration
	 i // interval
 }
 
 */
var song = new Song({
	title: 'Name',
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
});

var layout = new Layout();





class App extends Component {
	constructor(props) {
		super(props);
		
		this.state = {
			song: song,
			layout: layout,
            selectedMeasure: {},
            selectedNote: {},
            locked: false,
            dragging: {},
            showSettings: false,
            showLoadFile: false,
			showSaveFile: false
		};

        this.measureRef = React.createRef();

        const fretCount = 24;
        this.frets = [];
        for (let i = 0; i < fretCount; i++) {
            this.frets.push(i);
        }

        this.handleMeasureSelect = this.handleMeasureSelect.bind(this);
        this.clearSelectedMeasure = this.clearSelectedMeasure.bind(this);
        this.clearSelectedNote = this.clearSelectedNote.bind(this);
        this.handleChangeSelectedNoteString = this.handleChangeSelectedNoteString.bind(this);
        this.handleLock = this.handleLock.bind(this);
        this.toggleShowSettings = this.toggleShowSettings.bind(this);
        this.toggleShowLoadFile = this.toggleShowLoadFile.bind(this);
        this.loadSong = this.loadSong.bind(this);
        this.toggleShowSaveFile = this.toggleShowSaveFile.bind(this);
        this.setSelectedNote = this.setSelectedNote.bind(this);
        this.setDragging = this.setDragging.bind(this);
	}

    handleSongUpdated() {
        this.setState({
            song: this.state.song
        })
    }

    // Selection

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

    setSelectedNote(measure, stringIndex, noteIndex) {
        console.log('setSelectedNote', measure, stringIndex, noteIndex)
        const m = measure.props.measure,
            noteObj = m.noteWithIndex(stringIndex, noteIndex)

        this.setState({
            selectedNote: {
                measure: measure.props.measure.key,
                string: stringIndex,
                note: noteIndex,
                noteObj: noteObj,
                measureObj: measure
            },
        });
    }

    selectedNoteModified(change) {
        const selNote = this.state.selectedNote;
        Object.keys(change).forEach(k => selNote.noteObj[k] = change[k])

        console.log('selectedNoteModified ', this.state.selectedNote.noteObj)
        this.handleSongUpdated()
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

    insertNewBeforeSelectedMeasure() {
        const song = this.state.song,
            index = song.measureIndexWithKey(this.state.selectedMeasure.key),
            newM = song.newMeasure()

        console.log('insert', index, newM)
        song.insertMeasureAtIndex(index, newM)
  
        this.setState({
            song: this.state.song
        });
    }

    

    toggleShowSettings() {
        this.setState(prevState => ({
            showSettings: !prevState.showSettings
        }));
    }

    toggleShowLoadFile() {
        this.setState(prevState => ({
            showLoadFile: !prevState.showLoadFile
        }));
    }

	toggleShowSaveFile() {
        this.setState(prevState => ({
            showSaveFile: !prevState.showSaveFile
        }));
    }

    handleLock() {
        console.log('lock')
        this.setState(prevState => ({
            locked: !prevState.locked
        }));
    }


   

    setDragging(obj) {
        this.setState({
            dragging: obj
        })
    }

    loadSong(json) {
        this.setState({
            song: new Song(json),
            showLoadFile: false
        })
    }


    render() {
        const hasSelectedNote = this.state.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.state.selectedMeasure.key !== undefined;

    //    console.log('selnote: ', this.state.selectedNote);
     //   console.log('layout2 ', this.state.layout);
    return (
        <React.Fragment>

            <NavBar brand="Tabulater">
                <a className="nav-link" onClick={this.handleLock} ><span className={"fa fa-lock" + (this.state.locked ? ' text-info' : '')} ></span></a>

                <a className="nav-link" ><span className={"fa fa-play"} ></span></a>

                <a className="nav-link" onClick={this.toggleShowSettings}><span className={"fa fa-cog" + (this.state.showSettings ? ' text-info' : '')} ></span></a>

                <div className="dropdown">
                    <button className="btn btn-secondary dropdown-toggle" type="button" id="dropdownMenuButton" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                    <span className="fa fa-save"></span>
                    </button>
                    <div className="dropdown-menu" aria-labelledby="dropdownMenuButton">
                        <a className="dropdown-item" href="#" onClick={this.toggleShowLoadFile}>Load Song</a>
						<a className="dropdown-item" href="#" onClick={this.toggleShowSaveFile}>Save Song</a>
                    </div>
                </div>
 
             </NavBar>
            <div className="container" style={{ "marginTop": "1em" }}>
				<h4>{this.state.song.title}</h4>
				<h6>{this.state.song.author}</h6>


                <MeasureController song={this.state.song} onSongUpdate={this.handleSongUpdated}
                    selectedMeasure={this.state.selectedMeasure} onMeasureSelect={this.handleMeasureSelect}
                    selectedNote={this.state.selectedNote} onNoteSelect={this.setSelectedNote} layout={this.state.layout}
                    dragging={this.state.dragging} canDragNote={!this.state.locked} onDragging={this.setDragging} measureRef={this.measureRef} />

                {hasSelectedMeasure ? <MeasureEditor measureRef={this.measureRef} measure={this.state.selectedMeasure} controller={this} /> : ''}
                {hasSelectedNote ? <NoteEditor measureRef={this.measureRef} note={this.state.selectedNote} controller={this} frets={this.frets} /> : ''}

            </div>

            {this.state.showSettings && <SettingsEditor controller={this} />}
            {this.state.showLoadFile && <FileLoader controller={this} />}
			{this.state.showSaveFile && <SaveDialog controller={this} />}

            </React.Fragment>
    );
  }
}

//
// <MeasureController song={} selectedMeasure={} selecteNote={} onNoteSelect={} onMeasureSelect={} onSongUpdate={} 
//  dragging={} canDragNote={} measureRef={} />
//

class MeasureController extends Component {

    constructor(props) {
        super(props);

        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleChangeSelectedNoteString = this.handleChangeSelectedNoteString.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleStringDrop = this.handleStringDrop.bind(this);
    }

    stringEventDistance(measure, stringIndex, e) {
        const bound = e.target.getBoundingClientRect(),
            x = e.pageX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistanceOrRemaining(stringIndex, pos);

        // console.log('stringEventDistance ', stringIndex, x, w, pos, dist);

        return {
            p: pos,
            d: dist
        }
    }

    handleStringClick(measure, stringIndex, e) {
        if (this.state.locked) return

        const stringDist = this.stringEventDistance(measure, stringIndex, e)

        if (stringDist.d !== 0) {
            // doing calcs in larger values and then simplifying to avoid fractions
            const dur = Math.min(stringDist.d, 1) * measure.state.subdivisions,
                int = measure.props.measure.interval() * measure.state.subdivisions

            console.log('dur ', dur, ' dist ', stringDist.d, measure.state.subdivisions * Math.min(stringDist.d, 1));

            const note = {
                p: stringDist.p, d: dur, f: 0, i: int
            }
            this.simplifyNoteTiming(note);

            console.log(' str ', int, note)

            const idx = measure.addNote(stringIndex, note)

            this.props.onSongUpdate()
            this.props.onNoteSelect(measure, stringIndex, idx)
        }

    }

    handleStringDrop(measure, stringIndex, e) {
        const stringDist = this.stringEventDistance(measure, stringIndex, e)

        console.log('handleStringDrop string ', stringIndex, ' dist ', stringDist.d)

        if (stringDist.d !== 0) {
            const drag = this.props.dragging,
                m = this.props.song.measureWithKey(drag.measure),
                note = m.noteWithIndex(drag.string, drag.note)

            console.log('pos ', stringDist.p, ' end ', note.d + stringDist.p, 'dist & d ', stringDist.d, note.d)

            if (stringDist.d < note.d) {
                console.log('cant fit')
                return
            } else {
                m.removeNote(drag.string, drag.note)

                note.p = stringDist.p
                measure.addNote(stringIndex, note)
            }
        }
    }

    handleDragOver(measure, stringIndex, evt) {
        //console.log('dragover', measure, evt)
        evt.preventDefault()

        const stringDist = this.stringEventDistance(measure, stringIndex, evt)

        if (stringDist.d !== 0) {

            const drag = this.props.dragging,
                m = this.props.song.measureWithKey(drag.measure),
                note = m.noteWithIndex(drag.string, drag.note)

            //console.log('pos ', stringDist.p, ' end ', note.d + stringDist.p, 'dist & d ', stringDist.d, note.d)

            if (stringDist.d < note.d) {
                // console.log('cant fit')
                evt.dataTransfer.dropEffect = 'none'
                return
            }
        }

        evt.dataTransfer.dropEffect = 'move'
    }

    handleDragStart(info, evt) {
        console.log('dragstart')
        this.props.onDragging(info)
    }

    handleDragEnd(evt) {
        console.log('dragend')
        this.props.onDragging({})
    }


    handleChangeSelectedNoteString(string) {
        const measure = this.props.selectedNote.measureObj,
            removed = measure.removeNote(this.props.selectedNote.string, this.props.selectedNote.note),
            note = removed[0],
            idx = measure.addNote(string, note)

        this.props.onSongUpdate()
        this.props.onNoteSelect(measure, string, idx)
    }

    simplifyNoteTiming(note) {
        while (note.d % 2 === 0 && note.i % 2 === 0) {
            note.d /= 2
            note.i /= 2
        }
    }

    createMeasureTag(measure) {
        const optionalAtts = {}

        if (this.measureNeedsRef(measure)) {
            optionalAtts.forwardedRef = this.props.measureRef
        }


        return (

        <MeasureDisplay
            key={measure.key} measure={measure} layout={this.props.layout}
            selected={measure.key === this.props.selectedMeasure.key} onMeasureSelect={this.props.onMeasureSelect}
            onStringClick={this.handleStringClick} onStringDragOver={this.handleDragOver} onStringDrop={this.handleStringDrop}
            onNoteClick={this.props.onNoteSelect} selectedNote={this.props.selectedNote}
            onNoteDragStart={this.handleDragStart} onNoteDragEnd={this.handleDragEnd} canDragNote={this.props.canDragNote}
            {...optionalAtts}
        />)
    }

    measureNeedsRef(measure) {
        const hasSelectedNote = this.props.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.props.selectedMeasure.key !== undefined;

        if (hasSelectedNote) {
            return measure.key === this.props.selectedNote.measure;
        } else if (hasSelectedMeasure) {
            return measure.key === this.props.selectedMeasure.key;
        } else {
            return false;
        }
    }

    render() {
        return (
            <React.Fragment>
                {this.props.song.measures.map((measure, idx) => this.createMeasureTag(measure))}
            </React.Fragment>
         )
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

        $(this.editorRef.current).modal('show')
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

class ModalDialog extends Component {

    constructor(props) {
        super(props);
        this.dialogRef = React.createRef();

		this.handleClick = this.handleClick.bind(this)
		this.handleClickDialog = this.handleClickDialog.bind(this)
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        //$(this.dialogRef.current).modal('show')
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
                <div ref={this.dialogRef} className="modal show" tabIndex="-1" role="dialog" style={{ display: 'block'}} onClick={this.handleClick}>
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

class NavBar extends Component {

    constructor(props) {
        super(props);
        this.handleClose = this.handleClose.bind(this);
    }

    handleClose() {
        this.props.controller.toggleShowSaveFile();
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


export { App, MeasureDisplay };
