
import { Song } from './Model';





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

    test('findNoteSpan', () => {
        expect(song.findNoteSpan(song.measures[1].key, 1, 2, 4, 1).span.length).toEqual(1)
        expect(song.findNoteSpan(song.measures[1].key, 1, 2, 4, 3).span.length).toEqual(2)
        expect(song.findNoteSpan(song.measures[1].key, 1, 3, 4, 3).span.length).toEqual(1)
        expect(song.findNoteSpan(song.measures[1].key, 3, 3, 4, 3).span.length).toEqual(1)
        expect(song.findNoteSpan(song.measures[1].key, 3, 3, 4, 3, song.measures[2].strings[3][0].key).span.length).toEqual(2)

    //    console.log(song.findNoteSpan(song.measures[1].key, 3, 3, 4, 3, song.measures[2].strings[3][0].key))
    //   console.log(song.findNoteSpan(song.measures[1].key, 1, 1, 4, 1))
    //    console.log(song.findNoteSpan(song.measures[1].key, 1, 2, 4, 1))
    })

    test('sequenceSpan', () => {
        console.log(song.sequenceSpan(
            song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            song.measures[1].key,
            1,
            1)
        )

        console.log(song.sequenceSpan(
            song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            song.measures[1].key,
            2,
            1)
        )

        console.log(song.sequenceSpan(
            song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            song.measures[1].key,
            5,
            1)
        )
    })

    test('findDistance', () => {
        expect(song.findDistance(song.measures[0].key, 1, song.measures[0].key, 2)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    d: 1,
                    i: 4,
                })
            ])
        )

        expect(song.findDistance(song.measures[0].key, 1, song.measures[1].key, 1)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    d: 3,
                    i: 4,
                }),
                expect.objectContaining({
                    d: 1,
                    i: 4,
                })
            ])
        )

        expect(song.findDistance(song.measures[0].key, 1, song.measures[0].key, 1.5)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    d: 1,
                    i: 8,
                })
            ])
        )

        expect(song.findDistance(song.measures[1].key, 1, song.measures[0].key, 1.5)).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    d: -1,
                    i: 4,
                }),
                expect.objectContaining({
                    d: -5,
                    i: 8,
                })
            ])
        )
    })

    test('movePosition', () => {
        expect(song.movePosition(0, 1, { d: 1, i: 4 })).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 2,
                measureIndex: 0
            })
        )

        expect(song.movePosition(0, 1, { d: 1, i: 8 })).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 1.5,
                measureIndex: 0
            })
        )

        expect(song.movePosition(0, 2, { d: 1, i: 16 })).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 2.25,
                measureIndex: 0
            })
        )

        expect(song.movePosition(0, 2, { d: 3, i: 4 })).toEqual(
            expect.objectContaining({
                d: 1,
                i: 4,
                p: 0,
                measureIndex: 1
            })
        )

        expect(song.movePosition(0, 2.5, { d: 3, i: 8 })).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 0,
                measureIndex: 1
            })
        )

        expect(song.movePosition(1, 0, { d: -1, i: 4 })).toEqual(
            expect.objectContaining({
                d: 1,
                i: 4,
                p: 4,
                measureIndex: 0
            })
        )
    })

})