import { Song } from 'js/mdl/Song'
import { Measure } from 'js/mdl/Measure'
import { StringWriter } from 'js/util/StringWriter'

const stringLabels = ['e', 'B', 'G', 'D', 'A', 'E']

/*
 * e|-f-
 * ^^^^^
 * |||||
 * ||||There must be an empty space after a fret to break up the notes
 * |||Fret - may take two digits and other strings will have to account for
 * |||the extra space 
 * ||String Line (first always empty)
 * |Measure line
 * String label
 */
export class TabWriter {

    constructor(cfg) {
        this.result = []
        this.rowLength = cfg && cfg.rowLength ? cfg.rowLength : 80
    }

    setSong(song) {
        this.song = song

        this.stringWriters = new Array(song.context.stringCount)
        for (let i = 0; i < this.stringWriters.length; i++) {
            this.stringWriters[i] = new StringWriter({ stringLabel: stringLabels.length > i ? stringLabels[i] : '?' })
        }
    }

    findNoteInRange(measure, string, startPos, endPos, nextIndicies) {
        const notes = measure.strings[string],
            startIndex = nextIndicies[string] !== undefined ? nextIndicies[string] : 0

        if (startIndex >= 0 && startIndex < notes.length) {
            let nextIndex = startIndex
            while (nextIndex < notes.length) {
                const note = notes[nextIndex]
                if (note.p >= endPos) {
                    return { nextIndex }
                }

                nextIndex++

                if (note.p >= startPos && note.p < endPos) {
                    return { note, nextIndex }
                }
            }
        }

        return { nextIndex: -1 }
    }

    writeMeasure(measure) {
        const intervals = measure.distinctIntervals(),
            maxI = Math.max(...intervals),
            duration = measure.duration(),
            binSize = 4 / maxI,
            nextIndicies = new Map()

        let binStart = 0,
            binEnd = binSize

        for (const stringWriter of this.stringWriters) {
            stringWriter.writeMeasureLine()
            stringWriter.writeStringLine()
        }

        while (binStart < duration) {
            let noteList = new Array(measure.strings.length)
            console.log(`start ${binStart}, stop ${binEnd} nextIndicies `, nextIndicies)

            for (let string = 0; string < measure.strings.length; string++) {
                let result = this.findNoteInRange(measure, string, binStart, binEnd, nextIndicies)
                console.log('string', string, 'result', result)
                nextIndicies[string] = result.nextIndex
                if (result.note) {
                    noteList[string] = result.note
                }
            }

            let sizes = noteList.filter(n => n).map(n => (n.f + '').length + this.spaceForEffect(n.effect))
            console.log(`notes ${noteList} sizes`, sizes)

            if (sizes.length === 0) {
                for (const stringWriter of this.stringWriters) {
                    stringWriter.writeStringLine()
                }
            } else {
                let max = Math.max(...sizes)
                console.log('max', max)
                for (const [index, note] of noteList.entries()) {
                    let stringWriter = this.stringWriters[index],
                        value = '',
                        lineCount = 1

                    if (note) {
                        value = note.f

                        if (note.effect) {
                            const symbol = this.symbolForEffect(note.effect)
                            if (this.locationOfEffect(note.effect) > 0) {
                                value += symbol
                            } else {
                                value = symbol + value
                            }

                            lineCount = this.spaceForEffect(note.effect)
                        }
                    }

                    stringWriter.writePadded(value, max, '-')
                    stringWriter.writeStringLine(lineCount)
                }
            }
            

            binStart = binEnd
            binEnd += binSize
        }
    }

    symbolForEffect(effect) {
        switch (effect) {
            case 'vibrato':
                return '~'
            case 'slide-up':
                return '/'
            case 'slide-down':
                return '\\'
            default:
                return '?'
        }
    }

    locationOfEffect(effect) {
        switch (effect) {
            case 'vibrato':
                return 1
            default:
                return 1
        }
    }

    spaceForEffect(effect) {
        switch (effect) {
            case 'vibrato':
                return 1
            default:
                return 0
        }
    }

    writeSong() {
        for (const stringWriter of this.stringWriters) {
            stringWriter.writeStringLabel()
        }

        for (const measure of this.song.measures) {
            this.checkResult()
            this.writeMeasure(measure)
        }
    }

    checkResult() {
        if (this.stringWriters[0].buffer.length >= this.rowLength) {
            this.result.push(this.output())

            for (const stringWriter of this.stringWriters) {
                stringWriter.clear()
                stringWriter.writeStringLabel()
            }
        }
    }

    getTab() {
        if (this.stringWriters[0].buffer.length > 0) {
            this.result.push(this.output())
            
            this.stringWriters.forEach(sw => sw.clear())
        }

        return this.result.join("\n")
    }

    output() {
        return this.stringWriters.map(s => s.output()).join("\n")
    }
}