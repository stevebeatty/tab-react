import SoundPlayer from './SoundPlayer'

class SongPlayer {

    constructor(cfg) {
        this.soundPlayer = new SoundPlayer(cfg)
        this.song = cfg.song
    }

    initialize() {
        this.soundPlayer.initialize()
    }

    loadSounds() {
        return this.soundPlayer.loadSounds()
    }

    pause() {
        this.soundPlayer.pause()
    }

    resume() {
        this.soundPlayer.resume()
    }

    loadSong(song) {
        this.song = song
    }

	play() {
		this.soundPlayer.start()
	}

	stop() {
		this.soundPlayer.stop()
	}

    addSoundEffect(playResult, effectObj) {
        const { start, stop, effect } = effectObj,
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
        }
    }

    playNote(string, fret, start, stop) {
        const result = this.soundPlayer.playNote(string, fret, start, stop)
        this.soundPlayer.addNoteFade(result.gain, stop)
        return result
    }

    scheduleNotesInTimeRange(startTime, endTime) {
        this.song.measuresInTimeRange(startTime, endTime).forEach(m => {
            const measure = m.measure,
                measureStart = m.time,
				mi = measure.interval(),
                beatDelay = 60 / measure.tempo(),
                stringMap = measure.notesInTimeRange(startTime - m.time, endTime - m.time)

            //console.log('measure', measure.key, startTime - m.time, endTime - m.time)

            Object.keys(stringMap).forEach(s => {
                console.log('string', s)
                stringMap[s].forEach(n => {
                    const start = n.p * beatDelay + measureStart,
                        dur = (n.d / (n.i / mi)) * beatDelay,
                        stop = start + dur,
                        isContinued = 'continuedBy' in n,
                        continuesPrevious = 'continues' in n


                    if (!continuesPrevious) {
                        if (isContinued) { // start of sequence
                            console.log('sequence start', n.key, measure.key, start)
                            const seq = this.song.getNoteSequence(n.key, measure.key)
                            const result = this.song.sequenceSpan(seq, measure.key, s, start)
                            const analyzed = this.song.analyzeSequence(result.sequence, measureStart)

                            console.log('seq', analyzed)
                            for (const t of analyzed) {
                                let result = this.soundPlayer.playNote(s, t.f, t.start, t.stop)

                                if (t.effects) {
                                    for (const eff of t.effects) {
                                        this.addSoundEffect(result, eff)
                                    }
                                }
                            }

                        } else {
                            const result = this.soundPlayer.playNote(s, n.f, start, stop)

                            if (n.effect) {
                                this.addSoundEffect(result, {
                                    effect: n.effect,
                                    start,
                                    stop
                                })
                            }
                        }
                    }
                    
                })

            })

        })

    }
}

export default SongPlayer