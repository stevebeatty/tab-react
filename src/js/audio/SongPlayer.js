import SoundPlayer from './SoundPlayer'

/**
 * Plays songs using SoundPlayer to schedule playback
 */
class SongPlayer {

    /**
     * Constructs using the configuration, which is also passed to the SoundPlayer
     * 
     * @param {any} cfg
     */
    constructor(cfg) {
        this.soundPlayer = new SoundPlayer(cfg)
        this.song = cfg.song
    }

    /**
     * Initialize the player
     */
    initialize() {
        this.soundPlayer.initialize()
    }

    /**
     * Loads the sounds into the SoundPlayer
     */
    loadSounds() {
        return this.soundPlayer.loadSounds()
    }

    /**
     *  Pauses playback
     */
    pause() {
        this.soundPlayer.pause()
    }

    /**
     * Resumes playback
     */
    resume() {
        this.soundPlayer.resume()
    }

    /**
     * Sets the current song
     * 
     * @param {any} song
     */
    loadSong(song) {
        this.song = song
    }

    /**
     * Starts playback
     */
	play() {
		this.soundPlayer.start()
	}

    /**
     * Stops playback
     */
	stop() {
		this.soundPlayer.stop()
	}

    analyser() {
        return this.soundPlayer.analyser
    }

    /**
     * Adds an effect to audio nodes from playResult
     * 
     * @param {any} playResult
     * @param {any} effectObj
     */
    addSoundEffect(playResult, effectObj) {
        const { effect } = effectObj,
            node = playResult.bufferSource,
            gain = playResult.gain

        if (effect === 'vibrato') {
            console.log('vibrato')
            effectObj.frequency = effectObj.frequency || (60 / this.song.tempo()) * 4
            this.soundPlayer.addVibrato(node, effectObj)
        } else if (effect === 'slide-up' || effect === 'slide-down') {
            console.log('slide')
            this.soundPlayer.addSlide(node, effectObj)
        } else if (effect === 'bend-up') {
            console.log('bend-up')
            this.soundPlayer.addBend(node, effectObj)
        } else if (effect === 'pre-bend') {
            console.log('pre-bend')
            this.soundPlayer.addPreBend(node, effectObj)
        } else if (effect === 'pull-off' || effect === 'hammer-on') {
            console.log('pull-off')
            this.soundPlayer.addPullOff(node, gain, effectObj)
        } else if (effect === 'harmonic') {
            console.log('harmonic')
            this.soundPlayer.addDetune(node, effectObj)
            this.soundPlayer.addFilter(node, gain, effectObj)
        }
    }

    /**
     * Plays a single note on a string plus any effects
     * 
     * @param {any} string
     * @param {any} note
     */
    playNote(string, note) {
        const result = this.soundPlayer.playNote(string, note.f, note.start, note.stop)
        this.soundPlayer.addNoteFade(result.gain, note.stop)

        if (note.effects) {
            for (const eff of note.effects) {
                this.addSoundEffect(result, eff)
            }
        }

        return result
    }

    /**
     * Plays an iterable of notes on a string plus effects
     * 
     * @param {any} string
     * @param {any} notes
     */
    playNotes(string, notes) {
        if (Array.isArray(notes)) {
            for (const n of notes) {
                this.playNote(string, n)
            }
        } else {
            this.playNote(string, notes)
        }
    }

    /**
     * Copies sourceNote into note and performs preprocessing
     * 
     * @param {any} string
     * @param {any} note
     * @param {any} sourceNote
     */
    processNote(string, note, sourceNote) {
        if (sourceNote) {
            note = Object.assign(note, sourceNote)
        }

        if (Array.isArray(note.effects)) {
            for (const eff of note.effects) {

                eff.start = note.start
                eff.stop = note.stop

                if (eff.effect === 'harmonic') {
                    let detune = note.f * 100
                    if (note.f === 12) {
                        detune = 1200
                    } else if (note.f === 7 || note.f === 19) {
                        detune = 1900
                    } else if (note.f === 5 || note.f === 24) {
                        detune = 2400
                    }

                    eff.detune = detune

                    note.f = 0
                }
            }
        }

        return note
    }

    /**
     * Schedules all notes in the song for playback that occur between startTime and endTime
     * 
     * @param {any} startTime
     * @param {any} endTime
     */
    scheduleNotesInTimeRange(startTime, endTime) {
        this.song.measuresInTimeRange(startTime, endTime).forEach(m => {
            const measure = m.measure,
                measureStart = m.time,
				mi = measure.interval(),
                beatDelay = 60 / measure.tempo(),
                stringMap = measure.notesInTimeRange(startTime - m.time, endTime - m.time)


            Object.keys(stringMap).forEach(string => {
                console.log('string', string)
                stringMap[string].forEach(note => {
                    const start = note.p * beatDelay + measureStart,
                        dur = (note.d / (note.i / mi)) * beatDelay,
                        stop = start + dur,
                        isContinued = 'continuedBy' in note,
                        continuesPrevious = 'continues' in note

                    if (!continuesPrevious) {
                        let notes = null

                        if (isContinued) { // start of sequence
                            const seq = this.song.getNoteSequence(note.key, measure.key),
                                result = this.song.sequenceSpan(seq, measure.key, string, start)
                            notes = this.song.analyzeSequence(result.sequence, measureStart)
                        } else {
                            notes = this.processNote(string, { start, stop }, note)
                        }

                        this.playNotes(string, notes)
                    }
                    
                })

            })

        })

    }
}

export default SongPlayer