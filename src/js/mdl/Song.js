import { Measure } from './Measure'
import { IdGenerator, rangeArray, range } from 'js/util/Util';


export class Song {
    constructor(cfg) {
        this.context = {
            song: this,
            idGen: new IdGenerator(),
            stringCount: cfg.stringCount || 6
        }

        this.key = this.context.idGen.nextOrValue(cfg.key)
        this.title = cfg.title
        this.artist = cfg.artist
		this.i = cfg.i
        this.d = cfg.d
        this.t = cfg.tempo

		this.measures = []

        

        if (cfg.measures) {
            // preprocess the whole list of measures to set
            // key values appropriately
            const idGen = this.context.idGen
            for (const measure of cfg.measures) {
                idGen.accommodateIndex(measure.key)
                for (const string of measure.strings) {
                    for (const note of string) {
                        idGen.accommodateIndex(note.key)
                    }
                }
            }

            for (const measure of cfg.measures) {
                let m = new Measure(measure, this.context)
                this.measures.push(m)
            }
        }
		
    }

    /*
     * Song properties
     */ 

    interval() {
        return this.i
    }

    duration() {
        return this.d
    }

    tempo() {
        return this.t
    }

    totalTime() {
        let time = 0
        this.measures.forEach(m => time += m.totalTime())
        return time
    }

    /*
     * Measure methods
     */

    insertMeasureAtIndex(index, measure) {
        this.measures.splice(index, 0, measure);
    }

    measureAtTime(time) {
        let currTime = time,
            index = 0

        while (index < this.measures.length) {
            let measure = this.measures[index],
                mTot = measure.totalTime()

            if (mTot > currTime) {
                return {
                    measure: measure,
                    time: currTime
                }
            }

            currTime -= mTot
            index++
        }

        return {}
    }

    measuresInTimeRange(startTime, endTime) {
        let elapsedTime = 0,
            measureEnd = endTime,
            measures = [],
            index = 0

        while (index < this.measures.length) {
            let measure = this.measures[index],
                mTot = measure.totalTime(),
                measureStart = elapsedTime,
                measureEnd = elapsedTime + mTot

            if (measureStart <= endTime && measureEnd > startTime) {
                measures.push({
                    measure: measure,
                    time: measureStart
                })
            }

            if (elapsedTime > endTime) {
                return measures
            }

            elapsedTime += mTot
            index++
        }

        return measures
    }

    measureAfter(measureKey, playbackContext) {
        const index = this.measureIndexWithKey(measureKey)
        return index < this.measures.length - 1 ? this.measures[index + 1] : null
    }

    measureBefore(measureKey, playbackContext) {
        const index = this.measureIndexWithKey(measureKey)
        return index > 0 ? this.measures[index - 1] : null
    }

    measureWithKey(measureKey) {
        return this.measures.find(x => x.key === measureKey)
    }

    measureIndexWithKey(measureKey) {
        return this.measures.findIndex(x => x.key === measureKey)
    }

    newMeasure() {
        return new Measure({}, this.context)
    }

    

    /*
     * Note methods
     */ 

    noteWithKey(noteKey, measureKey) {
        if (measureKey !== undefined) {
            let measure = this.measureWithKey(measureKey)
            return {
                note: measure.noteWithKey(noteKey),
                measure
            }
        } else {
            for (let i = 0; i < this.measures.length; i++) {
                let measure = this.measures[i],
                    note = measure.noteWithKey(noteKey)

                if (note) {
                    return {
                        note,
                        measure
                    }
                }

            }
        }

        return null
    }

    noteIndexWithKey(noteKey) {
        for (let i = 0; i < this.measures.length; i++) {
            let measure = this.measures[i],
                index = measure.noteIndexWithKey(noteKey)

            if (index) {
                index.measureIndex = i
                return index
            }

        }

        return null
    }

    removeNoteByIndex(measureIndex, string, noteIndex) {
        const measure = this.measures[measureIndex],
            note = measure.removeNoteByIndex(string, noteIndex)

        if (note.continuedBy) {
            const continuedBy = this.noteWithKey(note.continuedBy)
            if (continuedBy) {
                delete continuedBy.continues
            }
        }

        if (note.continues) {
            const continues = this.noteWithKey(note.continues)
            if (continues) {
                delete continues.continuedBy
            }
        }
    }

    /*
     * Note sequence methods
     */ 

    getNoteSequence(noteKey, measureKey) {
        let mIndex = this.measureIndexWithKey(measureKey),
            measure = this.measures[mIndex],
            index = measure.noteIndexWithKey(noteKey),
            start = this.findNoteSequenceStart(index.noteIndex, index.string, mIndex),
            nextNoteIndex = start.noteIndex + 1,
            note = this.measures[start.measureIndex].strings[index.string][start.noteIndex],
            seq = []

        seq.push({ note, measure, string: index.string })

        while (mIndex < this.measures.length) {
            let measure = this.measures[mIndex],
                string = measure.strings[index.string]

            for (let i = nextNoteIndex; i < string.length; i++) {
                let nextNote = string[i]

                if (note.continuedBy !== nextNote.key) {
                    return seq
                }

                seq.push({ note: nextNote, measure, string: index.string })

                note = nextNote
            }

            mIndex++
            nextNoteIndex = 0
        }

        return seq
    }

	findNoteSequenceStart(noteIndex, stringIndex, measureIndex) {
		let measure = this.measures[measureIndex],
			note = measure.noteWithIndex(stringIndex, noteIndex)

		while ('continues' in note) {
			let prevNoteIndex = noteIndex - 1,
				prevMeasureIndex = measureIndex

			if (noteIndex <= 0) {
				if (measureIndex === 0) {
					break
				} else {
					prevMeasureIndex = measureIndex - 1
					prevNoteIndex = this.measures[prevMeasureIndex].strings[stringIndex].length - 1
				}
			}

			if (prevMeasureIndex < 0) {
				break
			}

			if (prevNoteIndex >= 0) {
				let prevNote = this.measures[prevMeasureIndex].noteWithIndex(stringIndex, prevNoteIndex)
				if (prevNote.key !== note.continues || prevNote.continuedBy !== note.key) {
					break
				}
				note = prevNote
			}

			noteIndex = prevNoteIndex
			measureIndex = prevMeasureIndex
		}

		return {
			measureIndex: measureIndex,
			noteIndex: noteIndex
		}
	}

    findNoteSpan(measureKey, string, position, interval, duration, skipKeys) {
        let mIndex = this.measureIndexWithKey(measureKey),
            measure = this.measures[mIndex],
            pos = position,
            dist = duration * measure.interval() / interval,
            result = []

        //console.log('findNoteSpan', mIndex, dist, skipKeys, this.measures[mIndex].strings[string].length)

        while (mIndex < this.measures.length && dist > 0) {
            let measure = this.measures[mIndex],
                noteDist = measure.nextNoteDistance(string, pos, skipKeys),
                i = measure.interval() / interval,
                span = Math.min(noteDist === -1 ? measure.duration() - pos : noteDist, dist)

            //console.log('fns', { m: measure.key, p: pos, span, noteDist, dist })

            if ((noteDist >= 0 && noteDist < dist) || span <= 0) {
                break
            }

            result.push({ measure, distance: span, p: pos })

            dist -= span
            pos = 0
            mIndex++
        }

        return {
            span: result,
            remaining: dist,
            endPos: result.length > 0 ? result[result.length - 1].distance + result[result.length - 1].p : undefined
        }
    }

    sequenceSpan(sequence, measureKey, string, position, skipKeys) {
        const keys = skipKeys || sequence.map(s => { return s.note.key })
        //console.log('seqspan', sequence)
        let mKey = measureKey,
            pos = position,
            result = { status: true, sequence: [], original: sequence }

        for (let i = 0; i < sequence.length; i++) {
            let { note } = sequence[i],
                noteSpan = this.findNoteSpan(mKey, string, pos, note.i, note.d, keys)

            //console.log('notespan', noteSpan)

            if (noteSpan.remaining > 0) {
                result.status = false
                break
            }

            result.sequence.push({
                note,
                span: noteSpan.span
            })

            mKey = noteSpan.span[noteSpan.span.length - 1].measure.key
            pos = noteSpan.endPos
        }

        return result
    }

    flattenSequenceSpans(sequence) {
        let parts = []

        sequence.forEach(segment => {
            //console.log('flattenSequenceSpans', segment.note, segment.span.length, ' => ')

            segment.span.forEach(segSpan => {

                const dur = this.distanceToDurationAndInterval(segSpan.distance, segSpan.measure),
                    p = { measure: segSpan.measure, p: segSpan.p, d: dur.d, i: dur.i, f: segment.note.f, note: segment.note }

                if (segment.note.effect) {
                    p.effect = segment.note.effect
                }

                parts.push(p)
                //console.log('    ', p)
            })
        })

        return parts
    }

    updateSequence(sequenceStatus) {
        let parts = this.flattenSequenceSpans(sequenceStatus.sequence)

        //console.log('parts', parts)

        let last = parts[0], mergedParts = []
        for (let i = 1; i < parts.length; i++) {
            let curr = parts[i]

            //console.log('can', this.canCombineParts(last, curr), last, curr)

            if (this.canCombineParts(last, curr)) {
                last = this.combineParts(last, curr)
            } else {
                last.key = this.context.idGen.next()
                mergedParts.push(last)
                last = curr
            }
        }
        last.key = this.context.idGen.next()
        mergedParts.push(last)

        for (let i = 0; i < mergedParts.length; i++) {
            let p = mergedParts[i]
            Measure.simplifyNoteTiming(p)

            if (i < mergedParts.length - 1) {
                p.continuedBy = mergedParts[i + 1].key
            }

            if (i > 0) {
                p.continues = mergedParts[i - 1].key
            }
        }

        return mergedParts
    }

    canCombineParts(first, second) {
        return first.measure.key === second.measure.key && first.f === second.f &&
            effectForName(first.effect).canCombine(effectForName(second.effect))
    }

    combineParts(first, second) {
        const baseInt = Math.max(first.i, second.i),
            secondMult = baseInt / second.i,
            firstMult = baseInt / first.i,
            combined = { measure: first.measure, p: first.p, d: secondMult * second.d + firstMult * first.d, i: baseInt, f: first.f }

        if (first.effect) {
            combined.effect = first.effect
        }

        return combined
    }

    static seqPartAddEffect(part, effectObj) {
        part.effects = part.effects || []
        part.effects.push(effectObj)
    }

    static seqPartRemoveFirstEffect(part, effect) {
        if (Array.isArray(part.effects)) {
            const idx = part.effects.findIndex(e => e.effect === effect)
            if (idx >= 0) {
                const removed = part.effects.splice(idx, 1)
                return removed.length > 0 ? removed[0] : null
            }
        }

        return null
    }

    analyzeSequence(sequence, startTime) {
        let parts = this.flattenSequenceSpans(sequence)

        //console.log('parts', parts)

        let last = null, mergedParts = []
        for (const part of parts) {
            let curr = part.measure.noteTiming(part, startTime)
            curr.f = part.f

            if ('effect' in part) {
                curr.effect = part.effect
            }

            let addToMerged = true

            if (last) {
                let lastEff = effectForName(last.effect)
                if (lastEff.canApplyEffect(last, curr)) {
                    addToMerged = addToMerged && lastEff.applyEffect(last, curr)
                }
            }

            let currEff = effectForName(curr.effect)
            if (currEff.canApplyEffect(last, curr)) {
                addToMerged = addToMerged && currEff.applyEffect(last, curr)
            }

            if (addToMerged) {
                mergedParts.push(curr)
                last = curr
            }
        }

		if (last) {
			let lastEff = effectForName(last.effect)

            if (lastEff.canApplyEffect(last, undefined)) {
                if(lastEff.applyEffect(last, undefined)) {
					mergedParts.push(last)
				}
            }
		}
        
        //console.log('after', mergedParts)

        return mergedParts
    }



    distanceToDurationAndInterval(distance, measure) {
        const baseInterval = measure.interval(),
            intDist = 1 / baseInterval,
            whole = Math.floor(distance),
            fract = distance % 1,
            safeFract = fract > 0 ? fract : 1,
            fractInt = baseInterval / safeFract,
            wholeInFrac = whole / safeFract

        return {
            d: (fract > 0 ? 1 : 0) + wholeInFrac,
            i: fractInt
        }
    }

    

    _addToDistanceResult(result, d, i) {
        if (d !== 0) {
            result.push(Measure.simplifyNoteTiming({ d: d * i, i: i * i }))
        }
    }

    findDistance(startMeasureKey, startPos, endMeasureKey, endPos) {
        let startIndex = this.measureIndexWithKey(startMeasureKey),
            endIndex = this.measureIndexWithKey(endMeasureKey),
            direction = Math.sign(endIndex - startIndex),
            measure = this.measures[startIndex],
            pos = startPos,
            currIndex = startIndex,
            result = []

        //console.log('findDistance', `startMeasureKey ${startMeasureKey}, startPos ${startPos}, endMeasureKey ${endMeasureKey}, endPos ${endPos}, currIndex ${currIndex} endIndex ${endIndex}`)

        while (currIndex < this.measures.length && currIndex >= 0) {
            let measure = this.measures[currIndex]

            //console.log('indexes: ', currIndex, endIndex, pos)

            if (currIndex > endIndex) {
                this._addToDistanceResult(result, -pos, measure.interval())
                pos = this.measures[currIndex + direction].duration()
            } else if (currIndex < endIndex) {
                this._addToDistanceResult(result, measure.duration() - pos, measure.interval())
                pos = 0
            } else {
                this._addToDistanceResult(result, endPos - pos, measure.interval())
                break
            }

            currIndex += direction
        }

        return result
    }

    movePositionList(measure, pos, distance) {
        let index = this.measureIndexWithKey(measure.key),
            result = { p: pos, measureIndex: index }
        //console.log('pos', pos, index)
        for (const d of distance) {
            let dist = d
            //console.log('dist', d)
            while (dist.d !== 0 && index >= 0 && index < this.measures.length) {
                result = this.movePosition(index, pos, dist)
                //console.log('mv', result)
                dist = result
                pos = result.p
                index = result.measureIndex
            }
        }

        return result
    }

    movePosition(measureIndex, pos, distance) {
        let measure = this.measures[measureIndex],
            d = distance.d,
            i = distance.i,
            p_i = pos * i,
            mi_d = d * measure.interval(),
            md_i = measure.duration() * i,
			nextMeasureIndex = measureIndex

        const num = p_i + mi_d
        let rem = 0, newPos = 0
        if (num > md_i) {
            rem = num - md_i
			nextMeasureIndex++
        } else if (num < 0) {
            rem = -num
            nextMeasureIndex--

            if (nextMeasureIndex >= 0) {
                newPos = this.measures[nextMeasureIndex].duration()
            }
        } else {
            newPos = num / i
           if (newPos >= measure.duration()) {
                newPos -= measure.duration()
                nextMeasureIndex++
            }
        }

        //console.log(`measureIndex ${measureIndex} pos ${pos}/${measure.interval()} + ${distance.d}/${distance.i} => nextMeasureIndex ${nextMeasureIndex} p ${newPos}, d ${rem}  mi_d ${mi_d} + p_i ${p_i} = num ${num}, md_i ${md_i}, rem ${rem}`)

        return Measure.simplifyNoteTiming({
            d: rem,
			i: measure.interval() * (rem === 0 ? 1 : distance.i),
			p: newPos,
			measureIndex: nextMeasureIndex
		})
    }

    

    

	export() {
		const obj = {
			title: this.title,
            artist: this.artist,
			i: this.i,
			d: this.d,
			tempo: this.t,
			measures: []
		}

		for (let i = 0; i < this.measures.length; i++) {
			let measure = this.measures[i].export()
			
			obj.measures.push(measure)
		}

		return obj
	}
}

class Effect {
    constructor(name) {
        this._name = name
    }

    get name() { return this._name }

    canCombine(effect) {
        return effect.name === this.name
    }

    canApplyEffect(lastPart, currPart) {
        return false
    }

    applyEffect(last, curr) {
        return false
    }
}

class NoEffect extends Effect {
    constructor() {
        super(undefined)
    }

    canApplyEffect(last, curr) {
        return last && curr && last.f === curr.f
    }

    applyEffect(last, curr) {
        last.stop = curr.stop
        return false
    }
}

class BaseSlideEffect extends Effect {
    constructor(name) {
        super(name)
    }

    canApplyEffect(last, curr) {
        return last && curr && last.effect === this.name
    }

    applyEffect(last, curr) {
        const removed = Song.seqPartRemoveFirstEffect(last, last.effect)
        Song.seqPartAddEffect(last, {
            effect: last.effect, start: last.start, stop: curr.stop, transistionStop: last.stop, detune: (curr.f - last.f) * 100
        })
        last.stop = curr.stop
        delete last.effect

        return false
    }
}

class VibratoEffect extends Effect {
    constructor() {
        super('vibrato')
    }

    canApplyEffect(last, curr) {
        return curr && curr.effect === this.name
    }

    applyEffect(last, curr) {
        Song.seqPartAddEffect(last, { effect: curr.effect, start: curr.start, stop: curr.stop })
        last.stop = curr.stop
        return false
    }
}

class BasePullEffect extends Effect {
    constructor(name) {
        super(name)
    }

    canApplyEffect(last, curr) {
        return last && curr && last.effect === this.name
    }

    applyEffect(last, curr) {
        Song.seqPartAddEffect(curr, {
            effect: last.effect, start: curr.start, stop: curr.stop
        })
        delete last.effect

        return true
    }
}

class PreBendEffect extends Effect {
    constructor() {
        super('pre-bend')
    }

    canApplyEffect(last, curr) {
        return last && curr && last.effect === this.name
    }

    applyEffect(last, curr) {
        const removed = Song.seqPartRemoveFirstEffect(last, last.effect),
			detuneEnd = curr ? curr.f : last.f - 2
        Song.seqPartAddEffect(last, {
            effect: last.effect, start: last.start, stop: last.stop, detune: (last.f - detuneEnd) * 100
        })
        last.stop = curr ? curr.stop : last.stop
        delete last.effect

        return false
    }
}

class HarmonicEffect extends Effect {
    constructor() {
        super('harmonic')
    }

    canApplyEffect(last, curr) {
        return curr && curr.effect === this.name
    }

    applyEffect(last, curr) {
        let detune = curr.f * 100
        if (curr.f === 12) {
            detune = 1200
        } else if (curr.f === 7 || curr.f === 19) {
            detune = 1900
        } else if (curr.f === 5 || curr.f === 24) {
            detune = 2400
        }

        Song.seqPartAddEffect(curr, {
            effect: curr.effect, start: curr.start, stop: curr.stop, detune
        })

        curr.f = 0

        delete curr.effect

        return true
    }

}

function addEffectToMap(effect) {
    effectMap.set(effect.name, effect)
    return effect
}

const effectMap = new Map()
effectMap.set('none', new NoEffect())

function effectForName(name) {
    if (effectMap.has(name)) {
        return effectMap.get(name)
    }

    if (!name) {
        return effectMap.get('none')
    }

    switch (name) {
        case 'slide-up':
        case 'slide-down':
        case 'bend-up':
            return addEffectToMap(new BaseSlideEffect(name))
        case 'pull-off':
        case 'hammer-on':
            return addEffectToMap(new BasePullEffect(name))
        case 'vibrato':
            return addEffectToMap(new VibratoEffect())
        case 'pre-bend':
            return addEffectToMap(new PreBendEffect())
        case 'harmonic':
            return addEffectToMap(new HarmonicEffect())
    }
}
