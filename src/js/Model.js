import { IdGenerator, rangeArray } from './Util';


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

    noteIndexWithKey(noteKey) {
        for (let i = 0; i < this.strings.length; i++) {
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

    removeNote(string, noteIndex) {
        const notes = this.strings[string]
        return notes.splice(noteIndex, 1)
    }

    sortNotes(arr) {
        arr.sort( (a, b) => a.p - b.p )
    }

	export() {
		const obj = {
			i: this.i,
			d: this.d,
			strings: []
		}

		for (let i = 0; i < this.strings.length; i++) {
			let string = []
			for (let j = 0; j < this.strings[i].length; j++) {
				let note = {},
					orig = this.strings[i][j]

				note.i = orig.i
				note.d = orig.d
				note.p = orig.p
				note.f = orig.f

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
        this.author = cfg.author
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



    getNoteSequence(noteKey, measureKey) {
        let mIndex = this.measureIndexWithKey(measureKey),
			measure = this.measures[mIndex],
			index = measure.noteIndexWithKey(noteKey),
			noteIndex = index.note + 1,
            note = measure.noteWithKey(noteKey),
            seq = []

        seq.push({ note, measure, string: index.string })

		while (mIndex < this.measures.length) {
            let measure = this.measures[mIndex],
				string = measure.strings[index.string]

			for (let i = noteIndex; i < string.length; i++) {
				let nextNote = string[i]

				if (note.continuedBy !== nextNote.key) {
					return seq
				}

                seq.push({ note: nextNote, measure, string: index.string })

				note = nextNote
			}

			mIndex++
			noteIndex = 0
		}
      
        return seq
    }

    doesSequenceFit(sequence, measureKey, string, position) {
        const keys = []
        sequence.forEach(s => { keys.push(s.note.key) })

        let mKey = measureKey,
            pos = position,
            result = { status: true, sequence: [] }

        for (let i = 0; i < sequence.length; i++) {
            let { note } = sequence[i],
                noteSpan = this.findNoteSpan(mKey, string, pos, note.i, note.d, keys)
            
            if (noteSpan.remaining > 0) {
                result.status = false
                break
            }

            result.sequence.push({
                span: noteSpan.span
            })

            console.log('notespan', noteSpan)

            mKey = noteSpan.span[noteSpan.span.length - 1].measure.key
            pos = noteSpan.endPos
        }

        return result
    }

    findNoteSpan(measureKey, string, position, interval, duration, skipKeys) {
        let mIndex = this.measureIndexWithKey(measureKey),
            pos = position,
            dur = duration,
            result = []
        //console.log('measureKey', measureKey, mIndex)
        while (mIndex < this.measures.length && dur > 0) {
            let measure = this.measures[mIndex],
                dist = measure.nextNoteDistance(string, pos, skipKeys),
                i = measure.interval() / interval,
                span = Math.min(dist === -1 ? measure.duration() - pos : dist, dur)

            if (span <= 0) {
                break
            }

            console.log('fns', measure.key, pos, span, i, dist, dur)

            result.push({ measure, distance: span, p: pos })

            dur -= span / i
            pos = 0
            mIndex++
        }

        return {
            span: result,
            remaining: dur,
            endPos: result.length > 0 ? result[result.length - 1].distance + result[result.length - 1].p : undefined
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
			author: this.author,
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