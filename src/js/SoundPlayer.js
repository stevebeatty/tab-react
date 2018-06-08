import { IdGenerator } from './Util';

class SoundPlayer {

    constructor(cfg) {
        this.soundPath = cfg.soundPath
        this.soundMap = cfg.soundMap

        this.currentSounds = {}

        this.idGen = new IdGenerator()
    }

    initialize() {
        this.audioContext = new AudioContext()

        this.masterGain = this.audioContext.createGain()
        this.masterGain.gain.value = 1
        this.masterGain.connect(this.audioContext.destination)
    }

    loadSounds() {
        const promises = []

        Object.keys(this.soundMap).forEach(key => {
            const sounds = this.soundMap[key]
            sounds.forEach(sound => {
                promises.push(
                    fetch(this.soundPath + sound.file).then(resp => {
                        console.log('loaded ', sound.file, resp)
                        return resp.arrayBuffer()
                    }).then(buffer => {
                        console.log('buffer', buffer)
                        return this.audioContext.decodeAudioData(buffer)
                    }).then(data => {
                        console.log('decoded')
                        sound.data = data
                    })
                )
            })

            
        })

        return Promise.all(promises)
    }

    findSound(string, fret) {
        const intervals = this.soundMap[string] || []
        for (let i = 0; i < intervals.length; i++) {
            let interval = intervals[i]
            if (fret >= interval.begin && fret <= interval.end) {
                return interval
            }
        }
    }

    createSoundNodes(sound, startTime, stopTime, detune) {
        const bufferSource = this.audioContext.createBufferSource()
        bufferSource.buffer = sound.data
        bufferSource.detune.value = detune

        const gain = this.audioContext.createGain()
        gain.gain.value = 1
        bufferSource.connect(gain)
        gain.connect(this.masterGain)

        const soundId = this.idGen.next()
        this.currentSounds[soundId] = bufferSource

        bufferSource.onended = () => {
            delete this.currentSounds[soundId]
        }

        bufferSource.start(startTime)
        bufferSource.stop(stopTime)
    }

    playNote(string, fret, startTime, endTime) {
        const sound = this.findSound(string, fret)
        console.log('playNote', string, fret, sound)
        this.createSoundNodes(sound, startTime, endTime, fret * 100)
    }

    pause() {
        this.audioContext.suspend()
    }

    resume() {
        this.audioContext.resume()
    }
}

export default SoundPlayer