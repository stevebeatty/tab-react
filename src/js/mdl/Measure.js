import { IdGenerator, rangeArray, range } from 'js/util/Util'

export class Measure {
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

    /*
     * Properties
     */

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


    /*
     * Note methods
     */ 

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

    removeNoteByIndex(string, noteIndex) {
        const notes = this.strings[string]
        return notes.splice(noteIndex, 1)[0]
    }

    removeNoteByKey(noteKey, string) {
        let idx = (string !== undefined) ? this.noteIndexWithKey(noteKey, string) : this.noteIndexWithKey(noteKey)
        //console.log('re', noteKey, string, idx)
        return this.removeNoteByIndex(idx.string, idx.note)
    }

    nextNoteDistance(string, pos, skipKeys) {
        const notes = this.strings[string],
            skip = skipKeys === undefined ? [] :
                Array.isArray(skipKeys) ? skipKeys : [skipKeys]
        //console.log('nextNoteDistance', string, pos, notes, skip)

        for (let i = 0; i < notes.length; i++) {
            let n = notes[i]

            if (skip.indexOf(n.key) !== -1) {
                //console.log('skipping', n.key)
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

    static simplifyNoteTiming(note) {
        while (note.d !== 0 && note.d % 2 === 0 && note.i % 2 === 0) {
            note.d /= 2
            note.i /= 2
        }
        return note
    }

    noteLength(note) {
        return (note.d / note.i) * this.interval()
    }

    noteEndPosition(note) {
        return note.p + this.noteLength(note)
    }

    

    

    

    sortNotes(arr) {
        arr.sort((a, b) => a.p - b.p)
    }

    /*
     *  Time methods
     */ 

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

        rangeArray(0, this.strings.length).forEach(string => {
            const notes = this.stringNotesInTimeRange(string, startTime, endTime)
            if (notes.length > 0) {
                result[string] = notes
            }
        })

        return result
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