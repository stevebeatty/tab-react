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
                        dur = (n.d / (n.i/mi)) * beatDelay

                    //console.log('note sd', start, dur, 'pdi', n.p, n.d, n.i)

                    this.soundPlayer.playNote(s, n.f, start, start + dur)
                })

            })

        })

    }
}

export default SongPlayer