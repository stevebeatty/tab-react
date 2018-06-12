
import { Measure, Song } from './Model';


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

    test('doNotesOverlap', () => {
        expect(measure.doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 1, d: 1, i: 4, p: 2 })).toEqual(true);
        expect(measure.doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
        expect(measure.doNotesOverlap({ f: 1, d: 2, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(true);
        expect(measure.doNotesOverlap({ f: 1, d: 2, i: 8, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
    });

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

		const m2 = new Measure({ i: 4, d: 4, tempo: 120, strings: [
            [{ f: 1, d: 1, i: 4, p: 2 }]] })

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


describe('Song Class test', () => {
    var song, songCfg;

    beforeEach(() => {
        songCfg = {
            name: 'Name',
            author: 'Author',
            d: 4,
            i: 4,
            tempo: 60,
            measures: [
                {
                    strings: [
                        [{ f: 1, d: 1, i: 4, p: 2 }],
                        [],
                        [{ f: 7, d: 1, i: 4, p: 3 }],
                        [],
                        [],
                        []
                    ]
                },
                {
                    strings: [
                        [{ key: 28, f: 4, d: 1, i: 8, p: 3.5, continuedBy: 29 }],
                        [{ f: 13, d: 1, i: 8, p: 1 }],
                        [],
                        [{ f: 4, d: 1, i: 4, p: 0 }],
                        [],
                        [{ key: 25, f: 4, d: 1, i: 4, p: 0, continuedBy: 26 }, { key: 26, f: 4, d: 1, i: 4, p: 1, continuedBy: 27 }, { key: 27, f: 4, d: 1, i: 4, p: 2 }]
                    ]
                },
                {
                    strings: [
                        [{ key: 29, f: 4, d: 1, i: 4, p: 0 }],
                        [{ f: 13, d: 1, i: 16, p: 1 }],
                        [],
                        [{ f: 5, d: 1, i: 4, p: 0 }],
                        [{ f: 14, d: 1, i: 8, p: 0.5 }],
                        [{ f: 8, d: 1, i: 16, p: 1.25 }]
                    ]
                }
            ]
        }

        song = new Song(songCfg)
    });

    test('constructor', () => {
        expect(song.measures.length).toEqual(songCfg.measures.length)
        expect(song.i).toEqual(songCfg.i)
        expect(song.interval()).toEqual(songCfg.i)

        expect(song.d).toEqual(songCfg.d)
        expect(song.duration()).toEqual(songCfg.d)

        expect(song.measures[0].strings.length).toEqual(6)
        expect(song.key).toBeDefined()

        song.measures.forEach((m) => {
            expect(m.key).toBeDefined()
            expect(song.measureWithKey(m.key)).toEqual(m)
        })

        expect(song.measureIndexWithKey(song.measures[0].key)).toEqual(0)
        expect(song.measureIndexWithKey(song.measures[1].key)).toEqual(1)
    });

    test('tempo', () => {
        expect(song.tempo()).toEqual(60)
        expect(new Song({}).tempo()).toBeUndefined()
    })

    test('totalTime', () => {
        expect(song.totalTime()).toEqual(4 * 3)
    })

    test('insertMeasureAtIndex', () => {
        song.insertMeasureAtIndex(1, song.newMeasure())
        expect(song.measures.length).toEqual(songCfg.measures.length + 1)

        song.measures[1].strings.forEach((s) => {
            expect(s.length).toEqual(0)
        })
    })

    test('measureAtTime', () => {
        expect(song.measureAtTime(0).measure.key).toEqual(song.measures[0].key)
        expect(song.measureAtTime(0.5).measure.key).toEqual(song.measures[0].key)
        expect(song.measureAtTime(4).measure.key).toEqual(song.measures[1].key)
        expect(song.measureAtTime(6).measure.key).toEqual(song.measures[1].key)
        expect(song.measureAtTime(7.9999999).measure.key).toEqual(song.measures[1].key)
        expect(song.measureAtTime(8).measure.key).toEqual(song.measures[2].key)
        expect(song.measureAtTime(10).measure.key).toEqual(song.measures[2].key)
        expect(song.measureAtTime(11.99999).measure.key).toEqual(song.measures[2].key)
        expect(song.measureAtTime(12).measure).toBeUndefined()
    })

    test('measuresInTimeRange', () => {
        expect(song.measuresInTimeRange(0, 1).length).toEqual(1)
        expect(song.measuresInTimeRange(0, 2).length).toEqual(1)
        expect(song.measuresInTimeRange(0, 3).length).toEqual(1)
        expect(song.measuresInTimeRange(0, 4).length).toEqual(2)
        expect(song.measuresInTimeRange(2, 4).length).toEqual(2)
        expect(song.measuresInTimeRange(3, 4).length).toEqual(2)
        expect(song.measuresInTimeRange(4, 4).length).toEqual(1)
        expect(song.measuresInTimeRange(4, 7.999).length).toEqual(1)
        expect(song.measuresInTimeRange(0, 12).length).toEqual(3)
        expect(song.measuresInTimeRange(0, 120000).length).toEqual(3)
    })


    test('measureAfter', () => {
        for (let i = 0; i < song.measures.length - 1; i++) {
            expect(song.measureAfter(song.measures[i].key).key).toEqual(song.measures[i + 1].key)
        }

        expect(song.measureAfter(song.measures[song.measures.length - 1].key)).toBeNull()
    })

    test('measureBefore', () => {
        for (let i = 1; i < song.measures.length; i++) {
            expect(song.measureBefore(song.measures[i].key).key).toEqual(song.measures[i - 1].key)
        }

        expect(song.measureBefore(song.measures[0].key)).toBeNull()
    })

    test('noteIndexWithKey', () => {
        expect(song.noteIndexWithKey(song.measures[2].strings[5][0].key)).toEqual(expect.objectContaining({ string: 5, note: 0, measure: song.measures[2].key }))
        expect(song.noteIndexWithKey(song.measures[1].strings[1][0].key)).toEqual(expect.objectContaining({ string: 1, note: 0, measure: song.measures[1].key }))
        expect(song.noteIndexWithKey(-1)).toBeNull()
    })

	test('getNoteSequence', () => {
		expect(song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key).length).toEqual(3)
		expect(song.getNoteSequence(song.measures[1].strings[5][1].key, song.measures[1].key).length).toEqual(2)
		expect(song.getNoteSequence(song.measures[1].strings[5][2].key, song.measures[1].key).length).toEqual(1)

		expect(song.getNoteSequence(song.measures[1].strings[0][0].key, song.measures[1].key).length).toEqual(2)

		expect(song.getNoteSequence(song.measures[2].strings[3][0].key, song.measures[2].key).length).toEqual(1)
	})

})