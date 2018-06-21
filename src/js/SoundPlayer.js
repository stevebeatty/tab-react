import { IdGenerator } from './Util';

class SoundPlayer {

    constructor(cfg) {
        this.soundPath = cfg.soundPath
        this.soundMap = cfg.soundMap

        this.currentSounds = {}

        this.idGen = new IdGenerator()

		this.startTime = 0
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
			console.log('ending', soundId, this.audioContext.currentTime, 'expected', stopTime)
            delete this.currentSounds[soundId]
        }

		console.log('start', soundId, 'at', startTime, 'to', stopTime)
        bufferSource.start(startTime)
        bufferSource.stop(stopTime)

        return {
            bufferSource,
            gain
        }
    }

    addVibrato(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, 50),
            frequency = this.numberOrDefault(effect.frequency, 4)

        const [actualStart, actualStop] = this.getActualTimes(start, stop)

        let osc = this.audioContext.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = frequency

        let oscGain = this.audioContext.createGain()
        oscGain.gain.value = detune

        osc.connect(oscGain)
        oscGain.connect(node.detune)

        osc.onended = () => {
            console.log('ending osc', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start vibrato at', actualStart, 'to', actualStop)

        osc.start(actualStart)
        osc.stop(actualStop)
    }

    numberOrDefault(value, defaultValue) {
        return typeof value === 'number' ? value : defaultValue
    }

    addSlide(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, effect.effect === 'slide-up' ? 200 : -200),
            transistionStop = this.numberOrDefault(effect.transistionStop, stop)


        const [actualStart, actualStop, actualTransitionStop] = this.getActualTimes(start, stop, transistionStop)

        let src = this.audioContext.createConstantSource()
        src.offset.setValueAtTime(0.001, actualStart)
        src.offset.linearRampToValueAtTime(detune, actualTransitionStop)

        src.connect(node.detune)

        src.onended = () => {
            console.log('ending slide', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start slide at', actualStart, 'to', actualStop, 'transitionStop', transistionStop)

        src.start(actualStart)
        src.stop(actualStop)
    }

    addBend(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, 200),
            transistionStop = this.numberOrDefault(effect.transistionStop, stop)

        const [actualStart, actualStop, actualTransitionStop] = this.getActualTimes(start, stop, transistionStop)

        let src = this.audioContext.createConstantSource()
        src.offset.setValueAtTime(0.001, actualStart)
        src.offset.setTargetAtTime(detune, actualStart + 0.1, 0.5)
        //src.offset.exponentialRampToValueAtTime(detune, actualStart + dur / 8)

        src.connect(node.detune)

        src.onended = () => {
            console.log('ending bend', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start bend at', actualStart, 'to', actualStop)

        src.start(actualStart)
        src.stop(actualStop)
    }

    addPreBend(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, 200)

        const [actualStart, actualStop] = this.getActualTimes(start, stop)

        let src = this.audioContext.createConstantSource()
        src.offset.setValueAtTime(detune, 0.0001)
        src.offset.setTargetAtTime(0, actualStart + 0.01, 0.5)
        //src.offset.exponentialRampToValueAtTime(detune, actualStart + dur / 8)

        src.connect(node.detune)

        src.onended = () => {
            console.log('ending prebend', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start prebend at', actualStart, 'to', actualStop)

        src.start(actualStart)
        src.stop(actualStop)
    }

    addNoteFade(gainNode, noteStopTime, timeConstant = 0.015) {
        const [actualStop] = this.getActualTimes(noteStopTime - 2 * timeConstant)
        gainNode.gain.setTargetAtTime(0, actualStop, timeConstant)
    }

    getActualTimes() {
        return Array.from(arguments).map(a => this.startTime + a)
    }

	start() {
		if (this.audioContext.state === 'suspended') {
			console.log('resuming', this.audioContext.currentTime)
			this.audioContext.resume()
		} else {
			this.startTime = this.audioContext.currentTime
		}
	}

	stop() {
		Object.keys(this.currentSounds).forEach(id=> {
			const sound = this.currentSounds[id]
			sound.stop()

			delete this.currentSounds[id]
		})
	}

    playNote(string, fret, startTime, endTime) {
        const sound = this.findSound(string, fret),
			refTime = this.startTime
        console.log('playNote', string, fret, startTime, endTime)
        return this.createSoundNodes(sound, refTime + startTime, refTime + endTime, fret * 100)
    }

    pause() {
        this.audioContext.suspend()
    }

    resume() {
        this.audioContext.resume()
    }

}

export default SoundPlayer