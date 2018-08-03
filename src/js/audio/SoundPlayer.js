import { IdGenerator } from 'js/util/Util';

/**
 * Provides an interface to the underlying browser AudioContext that is used to play
 * sounds as well as methods to load sounds.
 */
class SoundPlayer {

    /**
     * Constructs using a configuration object which contains soundPath and soundMap
     * 
     * @param {any} cfg
     */
    constructor(cfg) {
        this.soundPath = cfg.soundPath
        this.soundMap = cfg.soundMap

        this.currentSounds = {}

        this.idGen = new IdGenerator()

		this.startTime = 0
    }

    /**
     * Initializes the audio context and master gain
     */
    initialize() {
        this.audioContext = new AudioContext()

        this.masterGain = this.audioContext.createGain()
        this.masterGain.gain.setValueAtTime(1, this.audioContext.currentTime)

        this.analyser = this.audioContext.createAnalyser()

        this.masterGain.connect(this.analyser)
        this.analyser.connect(this.audioContext.destination)
    }

    /**
     * Loads sounds from the soundMap configuration parameter.  Returns a promise
     * for all sounds loading.
     */
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

    /**
     * Finds the correct sound for a string and fret combination
     * 
     * @param {any} string
     * @param {any} fret
     */
    findSound(string, fret) {
        const intervals = this.soundMap[string] || []
        for (let i = 0; i < intervals.length; i++) {
            let interval = intervals[i]
            if (fret >= interval.begin && fret <= interval.end) {
                return interval
            }
        }
    }

    /**
     * Creates sound nodes in the audio context that are scheduled to occur from startTime to stopTime
     * Returns the bufferSource and gain nodes
     * 
     * @param {any} sound
     * @param {any} startTime
     * @param {any} stopTime
     * @param {any} detune
     */
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

    /**
     * Adds a vibrato effect to an audio node using the effect object
     * 
     * @param {any} node
     * @param {any} effect
     */
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

    /**
     * If value is a number type then value is returned, otherwise defaultValue
     * 
     * @param {any} value
     * @param {any} defaultValue
     */
    numberOrDefault(value, defaultValue) {
        return typeof value === 'number' ? value : defaultValue
    }

    /**
     * Adds a slide effect to an audio node using the effect object
     * 
     * @param {any} node
     * @param {any} effect
     */
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

    /**
     * Adds a bend effect to the audio node using the effect object
     * 
     * @param {any} node
     * @param {any} effect
     */
    addBend(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, 200)

        const [actualStart, actualStop] = this.getActualTimes(start, stop)

        let src = this.audioContext.createConstantSource()
        src.offset.setValueAtTime(0.001, actualStart)
        src.offset.setTargetAtTime(detune, actualStart + 0.1, 0.5)

        src.connect(node.detune)

        src.onended = () => {
            console.log('ending bend', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start bend at', actualStart, 'to', actualStop)

        src.start(actualStart)
        src.stop(actualStop)
    }

    /**
     * Adds a pre-bend effect to the audio node using the effect object
     * 
     * @param {any} node
     * @param {any} effect
     */
    addPreBend(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, 200)

        const [actualStart, actualStop] = this.getActualTimes(start, stop)

        console.log('prebend', start, stop)

        let src = this.audioContext.createConstantSource()
        src.offset.setValueAtTime(detune, 0.0001)
        src.offset.setTargetAtTime(0, actualStart + 0.01, 0.5)

        src.connect(node.detune)

        src.onended = () => {
            console.log('ending prebend', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start prebend at', actualStart, 'to', actualStop)

        src.start(actualStart)
        src.stop(actualStop)
    }

    /**
     * Adds a note fade effect to prevent sharp changes at the end of notes
     * 
     * @param {any} gainNode
     * @param {any} noteStopTime
     * @param {any} timeConstant
     */
    addNoteFade(gainNode, noteStopTime, timeConstant = 0.015) {
        const [actualStop] = this.getActualTimes(noteStopTime - 2 * timeConstant)
        gainNode.gain.setTargetAtTime(0, actualStop, timeConstant)
    }

    /**
     * Adds a timed detune effect to an audio node using the effect object
     * 
     * @param {any} node
     * @param {any} effect
     */
    addDetune(node, effect) {
        const { start, stop } = effect,
            detune = this.numberOrDefault(effect.detune, 200)

        const [actualStart, actualStop] = this.getActualTimes(start, stop)

        let src = this.audioContext.createConstantSource()
        src.offset.value = detune

        src.connect(node.detune)

        src.onended = () => {
            console.log('ending detune', this.audioContext.currentTime, 'expected', actualStop)
        }

        console.log('start detune at', actualStart, 'to', actualStop)

        src.start(actualStart)
        src.stop(actualStop)
    }

    /**
     * Adds a filter to nodes
     * 
     * @param {any} sourceNode
     * @param {any} gainNode
     * @param {any} effect
     */
    addFilter(sourceNode, gainNode, effect) {
        const filter = this.audioContext.createBiquadFilter()
        filter.type = 'highpass'
        filter.frequency.value = 7000
        filter.Q.value = 0.707

        var myFrequencyArray = new Float32Array(9);
        myFrequencyArray[0] = 100;
        myFrequencyArray[1] = 250;
        myFrequencyArray[2] = 500;
        myFrequencyArray[3] = 750;
        myFrequencyArray[4] = 1000;
        myFrequencyArray[5] = 2000;
        myFrequencyArray[6] = 3000;
        myFrequencyArray[7] = 4000;
        myFrequencyArray[8] = 5000;

        var magResponseOutput = new Float32Array(myFrequencyArray.length);
        var phaseResponseOutput = new Float32Array(myFrequencyArray.length);

        filter.getFrequencyResponse(myFrequencyArray, magResponseOutput, phaseResponseOutput);

        for (let i = 0; i <= myFrequencyArray.length - 1; i++) {
            console.log(`${myFrequencyArray[i]} Hz, Magnitude ${magResponseOutput[i]}, Phase ${phaseResponseOutput[i]} radians.`);
        }

        gainNode.disconnect(this.masterGain)

        gainNode.connect(filter).connect(this.masterGain)
    }

    /**
     * Adds a pull off effect to audio nodes based on the effect object
     * 
     * @param {any} sourceNode
     * @param {any} gainNode
     * @param {any} effect
     */
    addPullOff(sourceNode, gainNode, effect) {
        const gainDampen = this.audioContext.createGain()
        gainDampen.gain.value = 0.7

        gainNode.disconnect(this.masterGain)

        gainNode.connect(gainDampen).connect(this.masterGain)
    }

    /**
     * Gets the actual time for all arguments by adding the start time 
     * of the context
     */
    getActualTimes() {
        return Array.from(arguments).map(a => this.startTime + a)
    }

    /**
     * Sets the start time and unpauses the audio context
     */
	start() {
		if (this.audioContext.state === 'suspended') {
			console.log('resuming', this.audioContext.currentTime)
			this.audioContext.resume()
		} else {
			this.startTime = this.audioContext.currentTime
		}
	}

    /**
     * Cancels any currently playing sound
     */
	stop() {
		Object.keys(this.currentSounds).forEach(id=> {
			const sound = this.currentSounds[id]
			sound.stop()

			delete this.currentSounds[id]
		})
	}

    /**
     * Plays a note for a string and fret combination between startTime and endTime.  Returns
     * the audio nodes that were created
     * 
     * @param {any} string
     * @param {any} fret
     * @param {any} startTime
     * @param {any} endTime
     */
    playNote(string, fret, startTime, endTime) {
        const sound = this.findSound(string, fret),
			refTime = this.startTime
        console.log('playNote', string, fret, startTime, endTime)
        return this.createSoundNodes(sound, refTime + startTime, refTime + endTime, fret * 100)
    }

    /**
     * Pauses the audio context 
     **/
    pause() {
        this.audioContext.suspend()
    }

    /**
     * Resumes a paused audio context
     */
    resume() {
        this.audioContext.resume()
    }

}

export default SoundPlayer