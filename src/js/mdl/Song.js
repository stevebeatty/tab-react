import { Measure } from './Measure'
import { Effect, NoEffect, BaseSlideEffect, VibratoEffect, BasePullEffect, PreBendEffect, HarmonicEffect } from './Effect'
import { IdGenerator, range } from 'js/util/Util';

/**
 * Encapsulates properties of a song such as tempo and meter and internally
 * stores measures with notes
 **/
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

    /**
     * The musical note type that is represented by one beat - bottom number in a song's musical meter
     */
    interval() {
        return this.i
    }

    /**
     * The number of beats in a measure - the top number in a song's musical meter
     */
    duration() {
        return this.d
    }

    /**
     * Number of beats per minute
     */
    tempo() {
        return this.t
    }

    /**
     *  Total time of the song in seconds 
     */
    totalTime() {
        let time = 0
        this.measures.forEach(m => time += m.totalTime())
        return time
    }

    /*
     * Measure methods
     */

    /**
     * Inserts a measure at the index
     * 
     * @param {number} index
     * @param {any} measure
     */
    insertMeasureAtIndex(index, measure) {
        this.measures.splice(index, 0, measure);
    }

    /**
     * Finds the measure that would be playing at a given time
     * 
     * @param {number} time
     */
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

    /**
     * Finds measures that would be playing during the interval (startTime, endTime]
     * 
     * @param {any} startTime
     * @param {any} endTime
     */
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

    /**
     * The measure after another measure idenified by measureKey
     * 
     * @param {any} measureKey
     * @param {any} playbackContext
     */
    measureAfter(measureKey, playbackContext) {
        const index = this.measureIndexWithKey(measureKey)
        return index < this.measures.length - 1 ? this.measures[index + 1] : null
    }

    /**
     * The measure before another measure idenified by measureKey
     * 
     * @param {any} measureKey
     * @param {any} playbackContext
     */
    measureBefore(measureKey, playbackContext) {
        const index = this.measureIndexWithKey(measureKey)
        return index > 0 ? this.measures[index - 1] : null
    }

    /**
     * Finds a measure by key
     * 
     * @param {any} measureKey
     */
    measureWithKey(measureKey) {
        return this.measures.find(x => x.key === measureKey)
    }

    /**
     * Finds the index of a measure by measure key
     * 
     * @param {any} measureKey
     */
    measureIndexWithKey(measureKey) {
        return this.measures.findIndex(x => x.key === measureKey)
    }

    /**
     * Create a new measure using the song's context
     */
    newMeasure() {
        return new Measure({}, this.context)
    }

    

    /*
     * Note methods
     */ 

    /**
     * Finds a note by key, optionally using a specific measure as the search bounds.  If
     * no measure key is passed then searches all measures.
     * 
     * @param {any} noteKey
     * @param {any} measureKey
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

    /**
     * Finds the index of a note in a measure using the note key
     * 
     * @param {any} noteKey
     */
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

    /**
     * Removes a note from a measure and string using the note's index
     * 
     * @param {any} measureIndex
     * @param {any} string
     * @param {any} noteIndex
     */
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
     * Note sequence methods - note sequences are series of notes that continue each other
     */ 

    /**
     * Gets the note sequence as an array of notes by finding the note by key and
     * then finding the beginning of the sequence that note is in.
     * 
     * @param {any} noteKey
     * @param {any} measureKey
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

    /**
     * Finds the beginning of note sequences by using the start point identifed
     * by the arguments and traversing backwards
     * 
     * @param {any} noteIndex
     * @param {any} stringIndex
     * @param {any} measureIndex
     */
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

    /**
     * Finds the series of measures that a note would traverse if started in the measure
     * using the position, iterval and duration specified.
     * 
     * @param {any} measureKey
     * @param {any} string
     * @param {any} position
     * @param {any} interval
     * @param {any} duration
     * @param {any} skipKeys
     */
    findNoteSpan(measureKey, string, position, interval, duration, skipKeys) {
        let mIndex = this.measureIndexWithKey(measureKey),
            measure = this.measures[mIndex],
            pos = position,
            dist = duration * measure.interval() / interval,
            result = []

        while (mIndex < this.measures.length && dist > 0) {
            let measure = this.measures[mIndex],
                noteDist = measure.nextNoteDistance(string, pos, skipKeys),
                i = measure.interval() / interval,
                span = Math.min(noteDist === -1 ? measure.duration() - pos : noteDist, dist)

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

    /**
     * Finds the measures traversed by a sequence of notes.  Calls findNoteSpan
     * 
     * @param {any} sequence
     * @param {any} measureKey
     * @param {any} string
     * @param {any} position
     * @param {any} skipKeys
     */
    sequenceSpan(sequence, measureKey, string, position, skipKeys) {
        const keys = skipKeys || sequence.map(s => { return s.note.key })
        let mKey = measureKey,
            pos = position,
            result = { status: true, sequence: [], original: sequence }

        for (let i = 0; i < sequence.length; i++) {
            let { note } = sequence[i],
                noteSpan = this.findNoteSpan(mKey, string, pos, note.i, note.d, keys)

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

    /**
     * Flattens the spans of each piece of a sequence into an array of parts
     * 
     * @param {any} sequence
     */
    flattenSequenceSpans(sequence) {
        let parts = []

        sequence.forEach(segment => {

            segment.span.forEach(segSpan => {

                const dur = this.distanceToDurationAndInterval(segSpan.distance, segSpan.measure),
                    p = { measure: segSpan.measure, p: segSpan.p, d: dur.d, i: dur.i, f: segment.note.f, note: segment.note }

                if (segment.note.effects) {
                    p.effects = segment.note.effects
                }

                parts.push(p)
            })
        })

        return parts
    }

    /**
     * Converts a sequence result into an array of parts that are combined 
     * according to canCombineParts
     * 
     * @param {any} sequenceStatus
     */
    updateSequence(sequenceStatus) {
        let parts = this.flattenSequenceSpans(sequenceStatus.sequence)

        let last = parts[0], mergedParts = []
        for (let i = 1; i < parts.length; i++) {
            let curr = parts[i]

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

    /**
     * Whether parts can be combined because of their measure, note and effects
     * 
     * @param {any} first
     * @param {any} second
     */
    canCombineParts(first, second) {
        return first.measure.key === second.measure.key && first.f === second.f &&
            this.effectsCanCombine(first.effects, second.effects)
    }

    sortEffects(effects) {
        effects.sort((a, b) => {
            if (a.effect < b.effect) {
                return -1;
            } else if (a.effect > b.effect) {
                return 1;
            }

            return 0;
        });
    }

    /**
     * Determines if effects arrays can combine by checking the individual effects
     * 
     * @param {any} firstEffects
     * @param {any} secondEffects
     */
    effectsCanCombine(firstEffects, secondEffects) {
        const firstIsNotArray = !Array.isArray(firstEffects),
            secondIsNotArray = !Array.isArray(secondEffects)

        if (firstIsNotArray && secondIsNotArray) {
            return true // no effects
        }

        if (firstIsNotArray || secondIsNotArray || firstEffects.length !== secondEffects.length) {
            return false // mismatches
        }

        this.sortEffects(firstEffects)
        this.sortEffects(secondEffects)

        for (let i = 0; i < firstEffects.length; i++) {
            let first = firstEffects[i],
                second = secondEffects[i]

            if (!effectForName(first.effect).canCombine(effectForName(second.effect))) {
                return false
            }
        }

        return true
    }

    /**
     * Whether effects can be applied to two parts by calling canApplyEffect
     * on each effect in the list
     * 
     * @param {any} effects
     * @param {any} last
     * @param {any} curr
     */
    effectsCanApply(effects, last, curr) {
        if (!Array.isArray(effects)) {
            return effectForName('none').canApplyEffect(last, curr)
        }

        return effects.every(effObj => {
            const eff = effectForName(effObj.effect)
            return eff.canApplyEffect(last, curr)
        })
    }

    /**
     * Applies the array of effects to the last and curr parts.  Empty effect arrays 
     * will use the 'none' effect
     * 
     * @param {any} effects
     * @param {any} last
     * @param {any} curr
     */
    applyEffects(effects, last, curr) {
        if (!Array.isArray(effects)) {
            return effectForName('none').applyEffect(last, curr)
        }

        return effects.every(effObj => {
            const eff = effectForName(effObj.effect)
            return eff.applyEffect(last, curr)
        })
    }

    /**
     * Combines two combinable parts by finding a common interval and returning a
     * new part
     * 
     * @param {any} first
     * @param {any} second
     */
    combineParts(first, second) {
        const baseInt = Math.max(first.i, second.i),
            secondMult = baseInt / second.i,
            firstMult = baseInt / first.i,
            combined = { measure: first.measure, p: first.p, d: secondMult * second.d + firstMult * first.d, i: baseInt, f: first.f }

        if (first.effects) {
            combined.effects = first.effects
        }

        return combined
    }


    

    analyzeSequence(sequence, startTime) {
        let parts = this.flattenSequenceSpans(sequence)

        let last = null, mergedParts = []
        for (const part of parts) {
            let curr = part.measure.noteTiming(part, startTime)
            curr.f = part.f

            if ('effects' in part) {
                curr.effects = part.effects
            }

            let addToMerged = true

            if (last) {
                if (this.effectsCanApply(last.effects, last, curr)) {
                    addToMerged = addToMerged && !this.applyEffects(last.effects, last, curr)
                }
            }

            if (this.effectsCanApply(curr.effects, last, curr)) {
                addToMerged = addToMerged && !this.applyEffects(curr.effects, last, curr)
            }

            if (addToMerged) {
                mergedParts.push(curr)
                last = curr
            }
        }

		if (last) {
            if (this.effectsCanApply(last.effects, last, undefined)) {
                if (!this.applyEffects(last.effects, last, undefined)) {
					mergedParts.push(last)
				}
            }
		}
        
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

        while (currIndex < this.measures.length && currIndex >= 0) {
            let measure = this.measures[currIndex]

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

        for (const d of distance) {
            let dist = d
            while (dist.d !== 0 && index >= 0 && index < this.measures.length) {
                result = this.movePosition(index, pos, dist)
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
