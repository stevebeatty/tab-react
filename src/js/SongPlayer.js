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
                        end = start + dur

                    //console.log('note sd', start, dur, 'pdi', n.p, n.d, n.i)

                    const node = this.soundPlayer.playNote(s, n.f, start, end)
                    if (n.effect === 'vibrato') {
                        console.log('vibrato')
                        this.soundPlayer.addVibrato(node, start, end, 50, beatDelay * 4)
                    } else if (n.effect === 'slide-up') {
                        console.log('slide-up')
                        this.soundPlayer.addSlide(node, start, end, 200)
                    } else if (n.effect === 'slide-down') {
                        console.log('slide-down')
                        this.soundPlayer.addSlide(node, start, end, -200)
                    } else if (n.effect === 'bend-up') {
                        console.log('bend-up')
                        this.soundPlayer.addBend(node, start, end, 200)
                    } else if (n.effect === 'bend-down') {
                        console.log('bend-down')
                        this.soundPlayer.addBend(node, start, end, -200)
                    }
                })

            })

        })

    }
}

export default SongPlayer