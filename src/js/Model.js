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

	nextNoteDistance(string, pos, skipIndex) {
        const notes = this.strings[string];

        //console.log('notes ', notes);
        for (let i = 0; i < notes.length; i++) {
            if (skipIndex === i) {
                continue
            }

            let n = notes[i]
            //console.log('n ', n, n.p + (n.d / n.i * this.props.interval), pos, this.props.interval );
            if (n.p < pos) {
                if (n.p + (n.d / n.i * this.i) > pos) {
                    return 0
                }
            } else {
                return n.p - pos;
            }
        }

        return -1;
    }

    nextNoteDistanceOrRemaining(string, pos, skipIndex) {
        const nextNoteDist = this.nextNoteDistance(string, pos, skipIndex)
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

	noteWithIndex(stringIndex, noteIndex) {
		return this.strings[stringIndex][noteIndex]
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