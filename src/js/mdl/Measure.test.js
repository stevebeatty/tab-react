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
                [{ f: 1, d: 1, i: 4, p: 2 }, { f: 1, d: 1, i: 8, p: 3 }, { f: 1, d: 1, i: 4, p: 4 }]
            ]
        }

        measure = new Measure(measureCfg)
    })

    test('nextNoteDistance', () => {
        expect(measure.nextNoteDistance(0, 1)).toEqual(1);
        expect(measure.nextNoteDistance(0, 2)).toEqual(0);
        expect(measure.nextNoteDistance(0, 2.125)).toEqual(0);
        expect(measure.nextNoteDistance(0, 2.5)).toEqual(0);
        expect(measure.nextNoteDistance(0, 3)).toEqual(-1);

        expect(measure.nextNoteDistance(1, 1)).toEqual(-1);
        expect(measure.nextNoteDistance(1, 2)).toEqual(-1);
        expect(measure.nextNoteDistance(1, 2.5)).toEqual(-1);
        expect(measure.nextNoteDistance(1, 3)).toEqual(-1);

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

    test('validStringsForPosition', () => {
        expect(measure.validStringsForPosition(3)).toEqual(expect.arrayContaining([0, 1, 3, 4]))
        expect(measure.validStringsForPosition(2)).toEqual(expect.arrayContaining([1, 2, 3, 4]))
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

    test('noteEndPosition', () => {
        expect(measure.noteEndPosition(measure.strings[0][0])).toEqual(3)
        expect(measure.noteEndPosition(measure.strings[2][0])).toEqual(4)
        expect(measure.noteEndPosition(measure.strings[5][1])).toEqual(3.5)
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