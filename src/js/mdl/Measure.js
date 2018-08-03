import { IdGenerator, range } from 'js/util/Util'

/**
 * Represents a measure in a song that contains notes organized by strings (as in a guitar)
 */
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

    /**
     * The interval specified in the measure or the default interval in the song
     */
    interval() {
        return this.i || (this.context && this.context.song && this.context.song.interval())
    }

    /**
     * The duration specified in the measure or the default duration in the song
     */
    duration() {
        return this.d || (this.context && this.context.song && this.context.song.duration())
    }

    /**
     * The tempo specified in the measure or the default tempo in the song
     */
    tempo() {
        return this.t || (this.context && this.context.song && this.context.song.tempo())
    }

    /**
     * The total time of the measure in seconds
     */
    totalTime() {
        return this.duration() / (this.tempo() / 60)
    }


    /*
     * Note methods
     */ 

    /**
     * Adds a note to a string which will be resorted by position.  Returns the
     * index of the note in the string.
     * 
     * @param {any} string
     * @param {any} note
     */
    addNote(string, note) {
        if (!note.i) {
            note.i = this.interval()
        }

        note.key = this.context.idGen.nextOrValue(note.key)

        const notes = this.strings[string]
        notes.push(note)
        Measure.sortNotesByPosition(notes)

        return notes.indexOf(note)
    }

    /**
     * Returns the note at the specified indicies
     * 
     * @param {any} stringIndex
     * @param {any} noteIndex
     */
    noteWithIndex(stringIndex, noteIndex) {
        return this.strings[stringIndex][noteIndex]
    }

    /**
     * Finds the note with a given key on any string in the measure.  Returns
     * null if the note is note found.
     * 
     * @param {any} noteKey
     */
    noteWithKey(noteKey) {
        for (const string of this.strings) {
            for (const note of string) {
                if (note.key === noteKey) {
                    return note
                }
            }
        }

        return null
    }

    /**
     * Finds the index of a note (both string index and note index) by
     * searching through strings starting at the argument string index
     * 
     * @param {any} noteKey
     * @param {any} string
     */
    noteIndexWithKey(noteKey, string = 0) {
        for (let i = string; i < this.strings.length; i++) {
            let string = this.strings[i]
            for (let j = 0; j < string.length; j++) {
                let note = string[j]
                if (note.key === noteKey) {
                    return {
                        string: i,
                        noteIndex: j
                    }
                }
            }
        }

        return null
    }

    /**
     * Removes a note by string and note index.  Returns the removed note
     * 
     * @param {any} string
     * @param {any} noteIndex
     */
    removeNoteByIndex(string, noteIndex) {
        const notes = this.strings[string]
        return notes.splice(noteIndex, 1)[0]
    }

    /**
     * Removes a note by note key and string index.  Returns the removed note
     * 
     * @param {any} noteKey
     * @param {any} string
     */
    removeNoteByKey(noteKey, string) {
        let idx = (string !== undefined) ? this.noteIndexWithKey(noteKey, string) : this.noteIndexWithKey(noteKey)
        return this.removeNoteByIndex(idx.string, idx.noteIndex)
    }

    /**
     * Gets the distance to the next note in this measure after the arugment position. Returns
     * -1 if no note found.
     * 
     * @param {any} string
     * @param {any} pos
     * @param {any} skipKeys
     */
    nextNoteDistance(string, pos, skipKeys) {
        const notes = this.strings[string],
            skip = skipKeys === undefined ? [] :
                Array.isArray(skipKeys) ? skipKeys : [skipKeys]

        for (const n of notes) {
            if (skip.indexOf(n.key) !== -1) {
                continue
            }

            const extent = n.p + (n.d / n.i) * this.interval()

            if (n.p < pos) {
                if (extent > pos) {
                    return 0
                }
            } else {
                return n.p - pos
            }
        }

        return -1;
    }

    /**
     * Gets the distance to the next note in this measure or the remaining space in the
     * measure if no next note is found.
     * 
     * @param {any} string
     * @param {any} pos
     * @param {any} skipKeys
     */
    nextNoteDistanceOrRemaining(string, pos, skipKeys) {
        const nextNoteDist = this.nextNoteDistance(string, pos, skipKeys)
        return nextNoteDist === -1 ? this.duration() - pos : nextNoteDist
    }

    /**
     * Gets the previous note distance in the measure or -1 if no previous note can be found
     * 
     * @param {any} string
     * @param {any} pos
     */
    prevNoteDistance(string, pos) {
        const notes = this.strings[string]

        for (let i = notes.length - 1; i >= 0; i--) {
            let n = notes[i],
                extent = n.p + (n.d / n.i * this.i)

            if (n.p <= pos) {
                if (extent >= pos) {
                    return 0;
                } else {
                    return pos - extent
                }
            }
        }

        return -1
    }

    /**
     * Gets all notes across the strings that overlap the position as a Map with string index
     * as key.
     * 
     * @param {any} pos
     */
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

    /**
     * Calculates the start and stop times given a note and a measure startTime. Returns
     * an object with start and stop.
     * 
     * @param {any} note
     * @param {any} startTime
     */
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

    /**
     * Simplifies note timing for durations and intervals that are divisible by 2
     * 
     * @param {any} note
     */
    static simplifyNoteTiming(note) {
        while (note.d !== 0 && note.d % 2 === 0 && note.i % 2 === 0) {
            note.d /= 2
            note.i /= 2
        }
        return note
    }

    /**
     * Finds the length of the note in terms of the measure interval
     * 
     * @param {any} note
     */
    noteLength(note) {
        return (note.d / note.i) * this.interval()
    }

    /**
     * Finds the ending position of a note
     * 
     * @param {any} note
     */
    noteEndPosition(note) {
        return note.p + this.noteLength(note)
    }

    /**
     * Sorts notes by increasing position
     * 
     * @param {any} arr
     */
    static sortNotesByPosition(arr) {
        arr.sort((a, b) => a.p - b.p)
    }

    /*
     *  Time methods
     */ 

    /**
     * Converts a time to position in this measure.  If the argument time is out of range
     * -1 is returned.
     * 
     * @param {any} time
     */
    timeToPosition(time) {
        const total = this.totalTime()
        if (time > total || time < 0) {
            return -1
        }

        return this.duration() * (time / total);
    }

    /**
     * Returns all notes on a string that occuring in the argument time range
     * 
     * @param {any} string
     * @param {any} startTime
     * @param {any} endTime
     */
    stringNotesInTimeRange(string, startTime, endTime) {
        let notes = this.strings[string],
            totalT = this.totalTime(),
            startBound = Math.min(Math.max(0, startTime), totalT),
            endBound = Math.min(Math.max(0, endTime), totalT),
            startPos = this.timeToPosition(startBound),
            endPos = this.timeToPosition(endBound),
            result = []

        notes.forEach(note => {
            if (note.p >= startPos && note.p <= endPos) {
                result.push(note)
            }
        })

        return result
    }

    /**
     * Returns all notes on any string in the time range
     * 
     * @param {any} startTime
     * @param {any} endTime
     */
    notesInTimeRange(startTime, endTime) {
        const result = {}

        for (const string of range(0, this.strings.length)) {
            const notes = this.stringNotesInTimeRange(string, startTime, endTime)
            if (notes.length > 0) {
                result[string] = notes
            }
        }

        return result
    }

    /**
     * Returns a Set containing the distinct intervals that occur on any string
     */
    distinctIntervals() {
        const intervals = new Set()
        intervals.add(this.interval())

        for (const string of this.strings) {
            for (const note of string) {
                if (note.i) {
                    intervals.add(note.i)
                }
            }
        }

        return intervals
    }

    /**
     * Exports the measure as an object suitable for JSON
      */
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