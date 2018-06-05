import React, { Component } from 'react';
import '../css/App.css';
import tab1 from '../tab.js';
import Layout from './Layout.js';
import MeasureController from './MeasureController';
import MeasureDisplay from './MeasureDisplay';
import NoteEditor from './NoteEditor'
import MeasureEditor from './MeasureEditor'
import { Song, Measure } from './Model'
import { NavBar, ModalDialog } from './BaseBoot'
import { FileLoader, SaveDialog, SettingsEditor } from './Dialogs'
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
    tempo: 60,
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
            selection: {},
            locked: false,
            dragging: {},
            showSettings: false,
            showLoadFile: false,
            showSaveFile: false,
            timerId: null,
            lastTime: null,
            currentTime: 0,
            isPlayingSong: true
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
		this.handleSongUpdated = this.handleSongUpdated.bind(this);
        this.toggleShowSettings = this.toggleShowSettings.bind(this);
        this.toggleShowLoadFile = this.toggleShowLoadFile.bind(this);
        this.loadSong = this.loadSong.bind(this);
        this.toggleShowSaveFile = this.toggleShowSaveFile.bind(this);
        this.setSelectedNote = this.setSelectedNote.bind(this);
        this.setDragging = this.setDragging.bind(this);
        this.handleTimerTick = this.handleTimerTick.bind(this);
	}

    componentDidMount() {
        this.startTimer()
    }
    componentWillUnmount() {
        this.stopTimer()
    }

    startTimer() {
        if (this.state.timerId) {
            this.stopTimer()
        }

        this.setState({
            timerId: setInterval(this.handleTimerTick, 100),
            lastTime: new Date().getTime(),
            currentTime: 0
        });
    }

    stopTimer() {
        clearInterval(this.state.timerId);
    }

    handleTimerTick() {
        const endTime = new Date().getTime(),
            elapsed = (endTime - this.state.lastTime)/1000

        this.setState( prevState => ({
            lastTime: endTime,
            currentTime: prevState.currentTime + elapsed
        }));
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
            selection: {
                type: 'measure',
                value: {
                    measure: measure.props.measure
                }
            }
		}));
	}

    clearSelectedMeasure() {
        this.setState({ selectedMeasure: {}, selection: {} });
    }



    clearSelectedNote() {
        this.setState({ selectedNote: {}, selection: {} });
    }

    setSelectedNote(measure, stringIndex, noteIndex) {
        console.log('setSelectedNote', measure, stringIndex, noteIndex)
        const m = measure.props.measure,
            noteObj = m.noteWithIndex(stringIndex, noteIndex)

        this.setState({
            selection: {
                type: 'note',
                value: {
                    measure: measure.props.measure.key,
                    string: stringIndex,
                    note: noteIndex,
                    noteObj: noteObj,
                    measureObj: measure
                }
            }
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

    insertNewOffsetFromSelectedMeasure(offset = 0) {
        const song = this.state.song,
            index = song.measureIndexWithKey(this.state.selectedMeasure.key),
            newM = song.newMeasure()

        console.log('insert', index, newM)
        song.insertMeasureAtIndex(index + offset, newM)

        this.handleSongUpdated()
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
        const hasSelectedNote = this.state.selection.type === 'note';
        const hasSelectedMeasure = this.state.selection.type === 'measure';

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
                    selection={this.state.selection} onMeasureSelect={this.handleMeasureSelect}
                    onNoteSelect={this.setSelectedNote} layout={this.state.layout}
                    dragging={this.state.dragging} canDragNote={!this.state.locked} onDragging={this.setDragging} measureRef={this.measureRef}
                    canClickString={!this.state.locked} isPlayingSong={this.state.isPlayingSong} currentTime={this.state.currentTime} />

                {hasSelectedMeasure ? <MeasureEditor measureRef={this.measureRef} selection={this.state.selection} controller={this} /> : ''}
                {hasSelectedNote ? <NoteEditor measureRef={this.measureRef} selection={this.state.selection} controller={this} frets={this.frets} /> : ''}

            </div>

            {this.state.showSettings && <SettingsEditor controller={this} />}
            {this.state.showLoadFile && <FileLoader controller={this} />}
			{this.state.showSaveFile && <SaveDialog controller={this} />}

            </React.Fragment>
    );
  }
}







export { App };
