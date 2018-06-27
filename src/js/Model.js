import { IdGenerator, rangeArray, range } from './Util';


class Measure {
    constructor(cfg, ctx) {
        this.context = ctx || {}
        if (!this.context.idGen) {
            this.context.idGen = new IdGenerator()
        }

        this.key = this.context.idGen.nextOrValue(cfg.key)
		this.i = cfg.i
        this.d = cfg.d
        this.t = cfg.tempo

        this.strings = []
        if (cfg.strings) {
            for (let i = 0; i < cfg.strings.length; i++) {
                const cfgStr = cfg.strings[i]
                const str = []

                for (let j = 0; j < cfgStr.length; j++) {
                    const note = Object.assign({}, cfgStr[j])
                    note.key = this.context.idGen.nextOrValue(cfgStr[j].key)
                    str.push(note)
                }

                this.strings.push(str)
            }
        } else if (this.context.stringCount) {
            for (let s = 0; s < this.context.stringCount; s++) {
                this.strings.push([]);
            }
        }
        
    }

    interval() {
        return this.i || this.context && this.context.song && this.context.song.interval()
    }

    duration() {
        return this.d || this.context && this.context.song && this.context.song.duration()
    }

    tempo() {
        return this.t || this.context && this.context.song && this.context.song.tempo()
    }

    totalTime() {
        return this.duration() / (this.tempo() / 60)
    }

    timeToPosition(time) {
        const total = this.totalTime()
        if (time > total || time < 0) {
            return -1
        }

        return this.duration() * (time / total);
    }

    stringNotesInTimeRange(string, startTime, endTime) {
        let notes = this.strings[string],
			totalT = this.totalTime(),
			startBound = Math.min(Math.max(0, startTime), totalT),
			endBound = Math.min(Math.max(0, endTime), totalT),
            startPos = this.timeToPosition(startBound),
            endPos = this.timeToPosition(endBound),
            result = []

        //console.log('timerange', startPos, endPos)
        notes.forEach(note => {
        //    console.log('note', note)
            if (note.p >= startPos && note.p <= endPos) {
                result.push(note)
            }
        })

        return result
    }

	notesInTimeRange(startTime, endTime) {
		const result = {}

		rangeArray(0, this.strings.length).forEach( string => {
			const notes = this.stringNotesInTimeRange(string, startTime, endTime)
			if (notes.length > 0) {
				result[string] = notes
			}
		})

		return result
    }

    notesAtPosition(pos) {
        const result = new Map()

        for (const string of range(0, this.strings.length)) {
            let notes = this.strings[string]
            for (const [noteIndex, note] of notes.entries()) {
                if (note.p <= pos && this.noteEndPosition(note) > pos) {
                    result.set(string, { note, noteIndex })
                    break
                }
            }
        }

        return result
    }

    noteTiming(note, startTime) {
        const beatDelay = 60 / this.tempo(),
            start = note.p * beatDelay + startTime,
            dur = (note.d / (note.i / this.interval())) * beatDelay,
            stop = start + dur

        return {
            start,
            stop
        }
    }

    simplifyNoteTiming(note) {
        while (note.d % 2 === 0 && note.i % 2 === 0) {
            note.d /= 2
            note.i /= 2
        }
    }

	doNotesOverlap(a, b) {
        const mi = this.i;
        //     b~~~~~~
        //            a~~~~
        // -----------------------------
        //     ^      ^
        //console.log(' | ', b.p + (b.d * mi / b.i), a.p, a.p + (a.d * mi / a.i), b.p);

        if (b.p <= a.p) {
            return b.p + (b.d * mi / b.i) > a.p
        } else {
            return a.p + (a.d * mi / a.i) > b.p;
        }               
    }

	nextNoteDistance(string, pos, skipKeys) {
        const notes = this.strings[string],
            skip = skipKeys === undefined ? [] :
                 Array.isArray(skipKeys) ? skipKeys : [skipKeys]
        //console.log('skip', skip)

        //console.log('notes ', notes);
        for (let i = 0; i < notes.length; i++) {
            let n = notes[i]

            if (skip.indexOf(n.key) !== -1) {
            //    console.log('skipping', n.key)
                continue
            }

            
            const extent = n.p + (n.d / n.i) * this.interval()

            //console.log('n ', n, extent, pos, this.interval() );
            if (n.p < pos) {
                if (extent > pos) {
                    return 0
                }
            } else {
                return n.p - pos;
            }
        }

        return -1;
    }

    nextNoteDistanceOrRemaining(string, pos, skipKeys) {
        const nextNoteDist = this.nextNoteDistance(string, pos, skipKeys)
        return nextNoteDist === -1 ? this.duration() - pos : nextNoteDist
    }

    prevNoteDistance(string, pos) {
        const notes = this.strings[string];

        //console.log('notes ', notes);
        for (let i = notes.length - 1; i >= 0; i--) {
            let n = notes[i]
            //console.log('p ', n, n.p + (n.d / n.i * this.props.interval), pos);
            let extent = n.p + (n.d / n.i * this.i)
            //console.log('p ', pos, ' ? ', extent, n)
            if (n.p <= pos) {
                if (extent >= pos) {
                    return 0;
                } else {
                    return pos - extent
                }
            }
        }

        return -1;
    }

	validStringsForPosition(pos) {
        const valid = []
        for (let i = 0; i < this.strings.length; i++) {
            if (this.nextNoteDistance(i, pos) !== 0) {
                valid.push(i)
            }
        }

        return valid
    }

    noteLength(note) {
        return (note.d / note.i) * this.interval()
    }

    noteEndPosition(note) {
        return note.p + this.noteLength(note)
    }

	noteWithIndex(stringIndex, noteIndex) {
		return this.strings[stringIndex][noteIndex]
	}

    noteWithKey(noteKey) {
        for (let i = 0; i < this.strings.length; i++) {
            let string = this.strings[i]
            for (let j = 0; j < string.length; j++) {
                let note = string[j]
                if (note.key === noteKey) {
                    return note
                }
            }
        }

        return null
    }

    noteIndexWithKey(noteKey, string = 0) {
        for (let i = string; i < this.strings.length; i++) {
            let string = this.strings[i]
            for (let j = 0; j < string.length; j++) {
                let note = string[j]
                if (note.key === noteKey) {
                    return {
                        string: i,
                        note: j
                    }
                }
            }
        }

        return null
    }

    addNote(string, note) {
        if (!note.i) {
            note.i = this.interval()
        }

		note.key = this.context.idGen.nextOrValue(note.key)

        const notes = this.strings[string]
        notes.push(note)
        this.sortNotes(notes)

        return notes.indexOf(note)
    }

    removeNoteByIndex(string, noteIndex) {
        const notes = this.strings[string]
        return notes.splice(noteIndex, 1)
    }

    removeNoteByKey(noteKey, string) {
        let idx = (string !== undefined) ? this.noteIndexWithKey(noteKey, string) : this.noteIndexWithKey(noteKey)
        console.log('re', noteKey, string, idx)
        return this.removeNoteByIndex(idx.string, idx.note)
    }

    sortNotes(arr) {
        arr.sort( (a, b) => a.p - b.p )
    }

	export() {
        const obj = {
            key: this.key,
			i: this.i,
			d: this.d,
			strings: []
		}

		for (let i = 0; i < this.strings.length; i++) {
			let string = []
            for (let j = 0; j < this.strings[i].length; j++) {
                let note = Object.assign({}, this.strings[i][j])

				string.push(note)
			}

			obj.strings.push(string)
		}

		return obj
	}
}

class Song {
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
            for (let i = 0; i < cfg.measures.length; i++) {
                let m = new Measure(cfg.measures[i], this.context)
                this.measures.push(m)
            }
        }
		
    }

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

    getNoteSequence(noteKey, measureKey) {
        let mIndex = this.measureIndexWithKey(measureKey),
			measure = this.measures[mIndex],
			index = measure.noteIndexWithKey(noteKey),
			start = this.findNoteSequenceStart(index.note, index.string, mIndex),
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

    sequenceSpan(sequence, measureKey, string, position) {
        const keys = []
        sequence.forEach(s => { keys.push(s.note.key) })

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

            //console.log('notespan', noteSpan)

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

            if (last.measure.key === curr.measure.key && last.f === curr.f && 
                    !('effect' in curr) && !('effect' in last)) {
                let baseInt = Math.max(last.i, curr.i),
                    currMult = baseInt / curr.i,
                    lastMult = baseInt / last.i,
                    combined = { measure: last.measure, p: last.p, d: currMult * curr.d + lastMult * last.d, i: baseInt, f: last.f }

                last = combined
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
            p.measure.simplifyNoteTiming(p)

            if (i < mergedParts.length - 1) {
                p.continuedBy = mergedParts[i + 1].key
            }

            if (i > 0) {
                p.continues = mergedParts[i - 1].key
            }
        }

        return mergedParts
    }

    seqPartAddEffect(part, effectObj) {
        part.effects = part.effects || []
        part.effects.push(effectObj)
    }

    seqPartRemoveFirstEffect(part, effect) {
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

        console.log('parts', parts)

        let last = null, mergedParts = []
        for (let i = 0; i < parts.length; i++) {
            let p = parts[i],
                curr = p.measure.noteTiming(p, startTime)

            curr.f = p.f

            if ('effect' in p) {
                curr.effect = p.effect
            }

            if (last) {
                if (last.f === curr.f) {
                    if (!last.effect) {
                        if (!curr.effect) {
                            last.stop = curr.stop
                        } else {
                            if (curr.effect === 'vibrato') {
                                this.seqPartAddEffect(last, { effect: curr.effect, start: curr.start, stop: curr.stop })
                                last.stop = curr.stop
                            }
                        }
                        continue
                    }
                } else if (['slide-up', 'slide-down', 'bend-up'].includes(last.effect) && !curr.effect) {
                    const removed = this.seqPartRemoveFirstEffect(last, last.effect)
                    this.seqPartAddEffect(last, {
                        effect: last.effect, start: last.start, stop: curr.stop, transistionStop: last.stop, detune: (curr.f - last.f) * 100
                    })
                    last.stop = curr.stop
                    delete last.effect
                    continue
                } else if (['pre-bend'].includes(last.effect) && !curr.effect) {
                    const removed = this.seqPartRemoveFirstEffect(last, last.effect)
                    this.seqPartAddEffect(last, {
                        effect: last.effect, start: last.start, stop: last.stop, detune: (last.f - curr.f) * 100
                    })
                    last.stop = curr.stop
                    delete last.effect
                    continue
                } else if (['pull-off', 'hammer-on'].includes(last.effect)) {
                    this.seqPartAddEffect(curr, {
                        effect: last.effect, start: curr.start, stop: curr.stop
                    })
                    delete last.effect
                }
            }

            if (curr.effect === 'harmonic') {
                let detune = curr.f * 100
                if (curr.f === 12) {
                    detune = 1200
                } else if (curr.f === 7 || curr.f === 19) {
                    detune = 1900
                } else if (curr.f === 5 || curr.f === 24) {
                    detune = 2400
                }

                this.seqPartAddEffect(curr, {
                    effect: curr.effect, start: curr.start, stop: curr.stop, detune
                })

                curr.f = 0

                delete curr.effect
            }

            mergedParts.push(curr)
            last = curr
            
        }

        console.log('after', mergedParts)

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

            if (span <= 0) {
                break
            }

            //console.log('fns', { m: measure.key, p: pos, span, noteDist, dist })

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
    }


    noteIndexWithKey(noteKey) {
        for (let i = 0; i < this.measures.length; i++) {
            let measure = this.measures[i],
                index = measure.noteIndexWithKey(noteKey)

            if (index) {
                index.measure = measure.key
                return index
            }

        }

        return null
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
        return this.measures.find( x => x.key === measureKey )
    }

    measureIndexWithKey(measureKey) {
        return this.measures.findIndex( x => x.key === measureKey )
    }

    newMeasure() {
        return new Measure({}, this.context)
    }

    insertMeasureAtIndex(index, measure) {
        this.measures.splice(index, 0, measure);
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


export { Measure, Song };