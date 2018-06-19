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

    addSoundEffect(effect, node, start, end) {
        if (effect === 'vibrato') {
            console.log('vibrato')
            this.soundPlayer.addVibrato(node, start, end, 50, (60/this.song.tempo()) * 4)
        } else if (effect === 'slide-up') {
            console.log('slide-up')
            this.soundPlayer.addSlide(node, start, end, 200)
        } else if (effect === 'slide-down') {
            console.log('slide-down')
            this.soundPlayer.addSlide(node, start, end, -200)
        } else if (effect === 'bend-up') {
            console.log('bend-up')
            this.soundPlayer.addBend(node, start, end, 200)
        } else if (effect === 'bend-down') {
            console.log('bend-down')
            this.soundPlayer.addBend(node, start, end, -200)
        }
    }

    playNote(string, fret, start, end, effect) {
        const result = this.soundPlayer.playNote(string, fret, start, end),
            node = result.bufferSource

        if (effect) {
            this.addSoundEffect(effect, node, start, end)
        }

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
                        end = start + dur,
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
                                let res = this.playNote(s, t.f, t.start, t.end, t.effect)

                                if (t.delayedEffects) {
                                    for (const eff of t.delayedEffects) {
                                        this.addSoundEffect(eff.effect, res.bufferSource, eff.start, eff.end)
                                    }
                                }
                            }

                        } else {
                            this.playNote(s, n.f, start, end, n.effect)
                        }
                    }
                    
                })

            })

        })

    }
}

export default SongPlayer