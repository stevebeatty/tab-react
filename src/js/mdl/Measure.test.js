import { Measure } from './Measure'

describe('Measure test', () => {
    var measure, measureCfg

    beforeEach(() => {
        measureCfg = {
            i: 4,
            d: 4,
            tempo: 60,
            strings: [
                [{ f: 1, d: 1, i: 4, p: 2 }],
                [],
                [{ f: 7, d: 1, i: 4, p: 3 }],
                [],
                [],
                [{ f: 1, d: 1, i: 4, p: 2 }, { f: 1, d: 1, i: 8, p: 3 }, { f: 1, d: 1, i: 8, p: 3.5 }]
            ]
        }

        measure = new Measure(measureCfg)
    })

    

    test('interval', () => {
        expect(measure.interval()).toEqual(4)
        expect(new Measure({}).interval()).toBeUndefined()
    })

    test('duration', () => {
        expect(measure.duration()).toEqual(4)
        expect(new Measure({}).duration()).toBeUndefined()
    })

    test('tempo', () => {
        expect(measure.tempo()).toEqual(60)
        expect(new Measure({}).tempo()).toBeUndefined()
    })

    test('totalTime', () => {
        expect(measure.totalTime()).toEqual(4)
    })



    test('noteWithIndex', () => {
        expect(measure.noteWithIndex(0, 0)).toBeDefined()
    })

    test('noteWithKey', () => {
        expect(measure.noteWithKey(measure.strings[5][1].key)).toEqual(measure.strings[5][1])
        expect(measure.noteWithKey(measure.strings[0][0].key)).toEqual(measure.strings[0][0])
        expect(measure.noteWithKey(-1)).toBeNull()
    })

    test('noteIndexWithKey', () => {
        expect(measure.noteIndexWithKey(measure.strings[5][1].key)).toEqual(expect.objectContaining({ string: 5, note: 1 }))
        expect(measure.noteIndexWithKey(measure.strings[0][0].key)).toEqual(expect.objectContaining({ string: 0, note: 0 }))
        expect(measure.noteIndexWithKey(-1)).toBeNull()
    })

    test('addNote', () => {
        let note = { d: 1, i: 4, p: 2, f: 0 },
            idx = measure.addNote(0, note)

        expect(measure.noteIndexWithKey(note.key).note).toEqual(idx)
        expect(measure.strings[0].length).toEqual(measureCfg.strings[0].length + 1)
    })

    test('removeNoteByIndex', () => {
        expect(measure.removeNoteByIndex(0, 0)).toBeDefined()
        expect(measure.strings[0].length).toEqual(measureCfg.strings[0].length - 1)

        expect(measure.removeNoteByIndex(5, 0)).toBeDefined()
        expect(measure.strings[5].length).toEqual(measureCfg.strings[5].length - 1)

        expect(() => measure.removeNoteByIndex(-1)).toThrow()
    })

    test('removeNoteByKey', () => {
        expect(measure.removeNoteByKey(measure.strings[5][1].key)).toBeDefined()
        expect(measure.strings[5].length).toEqual(measureCfg.strings[5].length - 1)

        expect(() => measure.removeNoteByKey(-1)).toThrow()
    })


    test('nextNoteDistance', () => {
        expect(measure.nextNoteDistance(0, 1)).toEqual(1)
        expect(measure.nextNoteDistance(0, 2)).toEqual(0)
        expect(measure.nextNoteDistance(0, 2.125)).toEqual(0)
        expect(measure.nextNoteDistance(0, 2.5)).toEqual(0)
        expect(measure.nextNoteDistance(0, 3)).toEqual(-1)

        expect(measure.nextNoteDistance(1, 1)).toEqual(-1)
        expect(measure.nextNoteDistance(1, 2)).toEqual(-1)
        expect(measure.nextNoteDistance(1, 2.5)).toEqual(-1)
        expect(measure.nextNoteDistance(1, 3)).toEqual(-1)

        expect(measure.nextNoteDistance(5, 1)).toEqual(1)
        expect(measure.nextNoteDistance(5, 1.5)).toEqual(0.5)
        expect(measure.nextNoteDistance(5, 2)).toEqual(0)
        expect(measure.nextNoteDistance(5, 2.5)).toEqual(0)

    });

    test('nextNoteDistanceOrRemaining', () => {
        expect(measure.nextNoteDistanceOrRemaining(5, 2)).toEqual(0)
        expect(measure.nextNoteDistanceOrRemaining(5, 2.5)).toEqual(0)
    })

    test('prevNoteDistance', () => {
        expect(measure.prevNoteDistance(0, 1)).toEqual(-1);
        expect(measure.prevNoteDistance(0, 2)).toEqual(0);
        expect(measure.prevNoteDistance(0, 2.5)).toEqual(0);
        expect(measure.prevNoteDistance(0, 3)).toEqual(0);
        expect(measure.prevNoteDistance(0, 4)).toEqual(1);

        expect(measure.prevNoteDistance(1, 1)).toEqual(-1);
        expect(measure.prevNoteDistance(1, 2)).toEqual(-1);
        expect(measure.prevNoteDistance(1, 3)).toEqual(-1);
    })

    test('notesAtPosition', () => {
        expect(measure.notesAtPosition(0).size).toEqual(0)
        expect(measure.notesAtPosition(1).size).toEqual(0)
        expect(measure.notesAtPosition(2).size).toEqual(2)
        expect(measure.notesAtPosition(2.5).size).toEqual(2)
        expect(measure.notesAtPosition(3).size).toEqual(2)
        expect(measure.notesAtPosition(3.5).size).toEqual(2)
    })

    test('noteTiming', () => {
        expect(measure.noteTiming(measure.strings[5][1], 0)).toEqual(expect.objectContaining({ start: 3, stop: 3.5 }))
        expect(measure.noteTiming(measure.strings[5][1], 2)).toEqual(expect.objectContaining({ start: 5, stop: 5.5 }))
        expect(measure.noteTiming(measure.strings[0][0], 0)).toEqual(expect.objectContaining({ start: 2, stop: 3 }))
    })

    test('simplifyNoteTiming', () => {
        expect(Measure.simplifyNoteTiming({ d: 4, i: 16 })).toEqual(expect.objectContaining({ d: 1, i: 4 }))
        expect(Measure.simplifyNoteTiming({ d: 2, i: 16 })).toEqual(expect.objectContaining({ d: 1, i: 8 }))
        expect(Measure.simplifyNoteTiming({ d: 12, i: 16 })).toEqual(expect.objectContaining({ d: 3, i: 4 }))
    })

    test('noteLength', () => {
        expect(measure.noteLength(measure.strings[0][0])).toEqual(1)
        expect(measure.noteLength(measure.strings[2][0])).toEqual(1)
        expect(measure.noteLength(measure.strings[5][1])).toEqual(0.5)
    })

    test('noteEndPosition', () => {
        expect(measure.noteEndPosition(measure.strings[0][0])).toEqual(3)
        expect(measure.noteEndPosition(measure.strings[2][0])).toEqual(4)
        expect(measure.noteEndPosition(measure.strings[5][1])).toEqual(3.5)
    })

    test('sortNotesByPosition', () => {
        const arr = [{ p: 1 }, { p: 1.5 }, { p: 3 }, { p: 2 }]

        Measure.sortNotesByPosition(arr)

        for (let i = 0; i < arr.length - 1; i++) {
            let first = arr[i],
                second = arr[i + 1]

            expect(first.p).toBeLessThanOrEqual(second.p)
        }
    })


    test('timeToPosition', () => {
        expect(measure.timeToPosition(1)).toEqual(1)
        expect(measure.timeToPosition(2)).toEqual(2)
        expect(measure.timeToPosition(3)).toEqual(3)
        expect(measure.timeToPosition(4)).toEqual(4)
        expect(measure.timeToPosition(5)).toEqual(-1)
        expect(measure.timeToPosition(0)).toEqual(0)
        expect(measure.timeToPosition(-100)).toEqual(-1)

        const m2 = new Measure({ i: 4, d: 4, tempo: 120 })
        expect(m2.timeToPosition(1)).toEqual(2)
        expect(m2.timeToPosition(2)).toEqual(4)
        expect(m2.timeToPosition(3)).toEqual(-1)
        expect(m2.timeToPosition(4)).toEqual(-1)
        expect(m2.timeToPosition(5)).toEqual(-1)
        expect(m2.timeToPosition(0)).toEqual(0)
        expect(m2.timeToPosition(-100)).toEqual(-1)
    })

    test('stringNotesInTimeRange', () => {
        expect(measure.stringNotesInTimeRange(0, 0, 1).length).toEqual(0)
        expect(measure.stringNotesInTimeRange(0, 1, 2).length).toEqual(1)
        expect(measure.stringNotesInTimeRange(0, 2, 3).length).toEqual(1)
        expect(measure.stringNotesInTimeRange(0, 3, 4).length).toEqual(0)

        const m2 = new Measure({
            i: 4, d: 4, tempo: 120, strings: [
                [{ f: 1, d: 1, i: 4, p: 2 }]]
        })

        expect(m2.stringNotesInTimeRange(0, 0, 0.5).length).toEqual(0)
        expect(m2.stringNotesInTimeRange(0, 0, 1).length).toEqual(1)
        expect(m2.stringNotesInTimeRange(0, 0.5, 1).length).toEqual(1)
        expect(m2.stringNotesInTimeRange(0, 2, 3).length).toEqual(0)
        expect(m2.stringNotesInTimeRange(0, 3, 4).length).toEqual(0)
    })

    test('notesInTimeRange', () => {
        expect(Object.keys(measure.notesInTimeRange(0, 1)).length).toEqual(0)
        expect(Object.keys(measure.notesInTimeRange(0, 2)).length).toEqual(2)
        expect(Object.keys(measure.notesInTimeRange(1, 2)).length).toEqual(2)
        expect(Object.keys(measure.notesInTimeRange(0, 3)).length).toEqual(3)

        const notes = measure.notesInTimeRange(0, 4)
        expect(notes[0].length).toEqual(1)
        expect(notes[2].length).toEqual(1)
    })



});