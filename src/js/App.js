import React, { Component } from 'react';
import '../css/App.css';
import tab1 from '../songs/tab.js';
import Layout from './Layout.js';
import MeasureController from './MeasureController';
import MeasureDisplay from './MeasureDisplay';
import NoteEditor from './NoteEditor'
import MeasureEditor from './MeasureEditor'
import { Song, Measure } from './Model'
import { NavBar, ModalDialog } from './BaseBoot'
import { FileLoader, SaveDialog, SettingsEditor } from './Dialogs'
import SoundPlayer from './SoundPlayer';
import SongPlayer from './SongPlayer'
import testTab from '../songs/vib.json'

console.log(tab1);

/*
 note:
 {
	 f // fret
	 d // duration
	 i // interval
 }
 
 */
var song = new Song(testTab);

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
            lastScheduleTime: null,
            currentTime: 0,
            isPlayingSong: false,
            isPaused: false,
            timerInterval: 100
		};

        this.measureRef = React.createRef();

        const fretCount = 24;
        this.frets = [];
        for (let i = 0; i < fretCount; i++) {
            this.frets.push(i);
        }

        this.songPlayer = new SongPlayer({
            soundPath: 'sounds/clean/',
            soundMap: {
                0: [{ begin: 0, end: 12, file: 'e.mp3' }],
                1: [{ begin: 0, end: 12, file: 'b.mp3'}],
                2: [{ begin: 0, end: 12, file: 'g.mp3' }],
                3: [{ begin: 0, end: 12, file: 'd.mp3' }],
                4: [{ begin: 0, end: 12, file: 'a.mp3' }],
                5: [{ begin: 0, end: 12, file: 'ee.mp3' }]
            }/*
			soundMap: {
                0: [{ begin: 0, end: 12, file: '1st_String_E_64kb.mp3' }],
                1: [{ begin: 0, end: 12, file: '2nd_String_B__64kb.mp3'}],
                2: [{ begin: 0, end: 12, file: '3rd_String_G_64kb.mp3' }],
                3: [{ begin: 0, end: 12, file: '4th_String_D_64kb.mp3' }],
                4: [{ begin: 0, end: 12, file: '5th_String_A_64kb.mp3' }],
                5: [{ begin: 0, end: 12, file: '6th_String_E_64kb.mp3' }]
            }*/
        })

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
        this.playSong = this.playSong.bind(this)
        this.pauseSong = this.pauseSong.bind(this)
        this.stopSong = this.stopSong.bind(this)
	}

    componentDidMount() {
        this.songPlayer.initialize()
        this.songPlayer.loadSounds().then(resp => {
            console.log('sounds loaded')
            this.songPlayer.loadSong(this.state.song)
            //const sound = this.soundPlayer.findSound(3, 3)
            //this.soundPlayer.createSoundNodes(sound, 1, 2, 0)
            //this.playSong()
        })
 
    }
    componentWillUnmount() {
        this.stopSong()
    }

    startTimer(reset=true) {
        if (this.state.timerId) {
            this.stopTimer()
        }

        this.setState({
            timerId: setInterval(this.handleTimerTick, this.state.timerInterval),
			lastTime: new Date().getTime()
        })

		if (reset) {
			this.setState({
				lastScheduleTime: 0
			})
		}

    }

    stopTimer() {
        clearInterval(this.state.timerId);
    }

    handleTimerTick() {
        const interval = this.state.timerInterval / 1000,
			nextTime = this.state.lastScheduleTime + interval,
			elapsed = (new Date().getTime() - this.state.lastTime) / 1000,
			currentTime = this.state.currentTime + elapsed

        //console.log('tick', this.state.lastScheduleTime, nextTime)

		this.songPlayer.scheduleNotesInTimeRange(this.state.lastScheduleTime, nextTime)

        this.setState({
            lastScheduleTime: nextTime,
            currentTime: currentTime,
			lastTime: new Date().getTime()
        })

        if (currentTime > this.state.song.totalTime()) {
			console.log('stopping', currentTime)
            this.stopSong()
        }
    }

    loadSong(json) {
        this.setState({
            song: new Song(json),
            showLoadFile: false
        })
    }

    scheduleNext() {
        this.songPlayer.scheduleNotesInTimeRange(this.state.currentTime, this.state.timerInterval/1000)
    }

    playSong() {
        this.startTimer(!this.state.isPaused)
		this.songPlayer.play()

		this.setState({
            isPlayingSong: true,
            isPaused: false
        })
        //this.songPlayer.scheduleNotesInTimeRange(0, 12)
    }

    pauseSong() {
        this.setState({
            isPlayingSong: true,
            isPaused: true
        })

        this.stopTimer()
		this.songPlayer.pause()
    }

    stopSong() {
        this.setState({
            isPlayingSong: false,
            isPaused: false,
            currentTime: 0
        })

        this.stopTimer()
		this.songPlayer.stop()
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
        })
    }

    selectedNoteModified(change) {
        const selNote = this.state.selection.value;
        console.log('selectedNoteModified ', this.state.selection.value)
        Object.keys(change).forEach(k => selNote.noteObj[k] = change[k])

        this.handleSongUpdated()
    }


    handleChangeSelectedNoteString(string) {
        const measure = this.state.selection.value.measureObj,
            removed = measure.removeNoteByIndex(this.state.selection.value.string, this.state.selection.value.note),
            note = removed[0],
            idx = measure.addNote(string, note)

        this.handleSongUpdated()

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


    findCurrentlyPlayingMeasure() {
        return this.state.song.measureAtTime(this.state.currentTime)
    }
   

    setDragging(obj) {
        this.setState({
            dragging: obj
        })
    }

    


    render() {
        const hasSelectedNote = this.state.selection.type === 'note',
            hasSelectedMeasure = this.state.selection.type === 'measure',
            currentlyPlaying = this.state.isPlayingSong ? this.findCurrentlyPlayingMeasure() : {},
            showPlay = this.state.isPlayingSong && this.state.isPaused || !this.state.isPlayingSong

        const unit = '',
            height = 160,
            width = 400,
            startPoint = { x: 10, y: height / 2 },
            curveAmp = 70,
            pointDist = 55,
            ctrlOffset = 30,
            curveDeltas = {
                startCtrl: { dx: ctrlOffset, dy: -curveAmp },
                endCtrl: { dx: pointDist, dy: -curveAmp },
                end: { dx: ctrlOffset + pointDist, dy: 0 }
            }


    //    console.log('selnote: ', this.state.selectedNote);
     //   console.log('layout2 ', this.state.layout);
    return (
        <React.Fragment>

            <NavBar brand="Tabulater">
                <a className="nav-link" onClick={this.handleLock} ><span className={"fa fa-lock" + (this.state.locked ? ' text-info' : '')} ></span></a>

                {showPlay && <a className="nav-link" onClick={this.playSong}><span className={"fa fa-play"} ></span></a>}
                {this.state.isPlayingSong && !this.state.isPaused && <a className="nav-link" onClick={this.pauseSong}><span className={"fa fa-pause"} ></span></a>}
                {this.state.isPlayingSong && <a className="nav-link" onClick={this.stopSong}><span className={"fa fa-stop"} ></span></a>}
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
				<div>{this.state.currentTime}</div>
				<h4>{this.state.song.title}</h4>
				<h6>{this.state.song.author}</h6>


                <MeasureController song={this.state.song} onSongUpdate={this.handleSongUpdated}
                    selection={this.state.selection} onMeasureSelect={this.handleMeasureSelect}
                    onNoteSelect={this.setSelectedNote} layout={this.state.layout}
                    dragging={this.state.dragging} canDragNote={!this.state.locked} onDragging={this.setDragging} measureRef={this.measureRef}
                    canClickString={!this.state.locked}
                    isPlayingSong={this.state.isPlayingSong} currentTime={this.state.currentTime} playingMeasure={currentlyPlaying.measure} playingMeasureTime={currentlyPlaying.time}
                    isPaused={this.state.isPaused} />

                {hasSelectedMeasure && <MeasureEditor measureRef={this.measureRef} selection={this.state.selection} controller={this} song={this.state.song} />}
                {hasSelectedNote && <NoteEditor measureRef={this.measureRef} selection={this.state.selection} controller={this} frets={this.frets} song={this.state.song} />}

            </div>

            {this.state.showSettings && <SettingsEditor controller={this} />}
            {this.state.showLoadFile && <FileLoader controller={this} />}
			{this.state.showSaveFile && <SaveDialog controller={this} />}


            </React.Fragment>
    );
  }
}


export { App };
