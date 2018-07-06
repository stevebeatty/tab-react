import { Song } from './Song';


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
                        [{ key: 25, f: 4, d: 1, i: 4, p: 0, continuedBy: 26 }, { key: 26, f: 4, d: 1, i: 4, p: 1, continues: 25, continuedBy: 27 }, { key: 27, f: 4, d: 1, i: 8, p: 2, continues: 26 }]
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
        expect(song.d).toEqual(songCfg.d)

        expect(song.measures[0].strings.length).toEqual(6)
        expect(song.key).toBeDefined()

        song.measures.forEach((m) => {
            expect(m.key).toBeDefined()
            expect(song.measureWithKey(m.key)).toEqual(m)
        })

    })



    test('interval', () => {
        expect(song.interval()).toEqual(songCfg.i)
        expect(new Song({}).interval()).toBeUndefined()
    })

    test('duration', () => {
        expect(song.duration()).toEqual(songCfg.d)
        expect(new Song({}).duration()).toBeUndefined()
    })

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

    test('measureWithKey', () => {
        for (const measure of song.measures) {
            expect(song.measureWithKey(measure.key)).toBe(measure)
        }
    })

    test('measureIndexWithKey', () => {
        for (const [index, measure] of song.measures.entries()) {
            expect(song.measureIndexWithKey(measure.key)).toBe(index)
        }
    })

    test('newMeasure', () => {
        const m = song.newMeasure()
        expect(m).toBeDefined()
        expect(song.measures.length).toEqual(songCfg.measures.length)
        expect(m.strings.length).toEqual(song.context.stringCount)
        expect(m.interval()).toEqual(song.interval())
    })



    test('noteWithKey', () => {
        for (const measure of song.measures) {
            for (const string of measure.strings) {
                for (const note of string) {
                    let result = song.noteWithKey(note.key)
                    expect(result.note).toBe(note)
                    expect(result.measure).toBe(measure)
                }
            }
        }

        expect(song.noteWithKey(-1)).toBeNull()
    })

    test('noteIndexWithKey', () => {
        for (const [measureIndex, measure] of song.measures.entries()) {
            for (const [string, stringNotes] of measure.strings.entries()) {
                for (const [noteIndex, note] of stringNotes.entries()) {
                    expect(song.noteIndexWithKey(note.key)).toEqual(expect.objectContaining({
                        string: string,
                        noteIndex: noteIndex,
                        measureIndex: measureIndex
                    }))
                }
            }
        }

        expect(song.noteIndexWithKey(-1)).toBeNull()
    })

    test('removeNoteByIndex', () => {
        song.removeNoteByIndex(0, 0, 0)
        expect(song.measures[0].strings[0].length).toEqual(songCfg.measures[0].strings[0].length - 1)

        song.removeNoteByIndex(1, 5, 1)
        expect(song.measures[1].strings[5].length).toEqual(songCfg.measures[1].strings[5].length - 1)
    })



	test('getNoteSequence', () => {
		expect(song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key).length).toEqual(3)
		expect(song.getNoteSequence(song.measures[1].strings[5][1].key, song.measures[1].key).length).toEqual(3)
		expect(song.getNoteSequence(song.measures[1].strings[5][2].key, song.measures[1].key).length).toEqual(3)

		expect(song.getNoteSequence(song.measures[1].strings[0][0].key, song.measures[1].key).length).toEqual(2)

		expect(song.getNoteSequence(song.measures[2].strings[3][0].key, song.measures[2].key).length).toEqual(1)
    })

    test('findNoteSequenceStart', () => {
        expect(song.findNoteSequenceStart(0, 5, 1)).toEqual(
            expect.objectContaining({
                measureIndex: 1,
                noteIndex: 0,
            })
        )

        expect(song.findNoteSequenceStart(1, 5, 1)).toEqual(
            expect.objectContaining({
                measureIndex: 1,
                noteIndex: 0,
            })
        )

        expect(song.findNoteSequenceStart(2, 5, 1)).toEqual(
            expect.objectContaining({
                measureIndex: 1,
                noteIndex: 0,
            })
        )

        expect(song.findNoteSequenceStart(0, 0, 1)).toEqual(
            expect.objectContaining({
                measureIndex: 1,
                noteIndex: 0,
            })
        )
    })

    test('findNoteSpan', () => {
        expect(song.findNoteSpan(song.measures[1].key, 1, 2, 4, 1).span.length).toEqual(1)
        expect(song.findNoteSpan(song.measures[1].key, 1, 2, 4, 3).span.length).toEqual(2)
        expect(song.findNoteSpan(song.measures[1].key, 1, 3, 4, 3).span.length).toEqual(1)
        expect(song.findNoteSpan(song.measures[1].key, 3, 3, 4, 3).span.length).toEqual(1)
        expect(song.findNoteSpan(song.measures[1].key, 3, 3, 4, 3, song.measures[2].strings[3][0].key).span.length).toEqual(2)
    })

    test('sequenceSpan', () => {
        // moving sequence from the last string
        const sequence = song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            measureKey = song.measures[1].key

        // theres a note at pos 1 on 2nd string
        const span1 = song.sequenceSpan(sequence, measureKey, 1, 1)
        expect(span1.status).toEqual(false)

        // theres nothing on 3rd string
        const span2 = song.sequenceSpan(sequence, measureKey, 2, 1)
        expect(span2.status).toEqual(true)

        // moving the sequence over itself, which should cause the method to skip those notes
        const span3 = song.sequenceSpan(sequence, measureKey, 5, 1)
        expect(span3.status).toEqual(true)
    })

    test('flattenSequenceSpans', () => {
        const sequence = song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            measureKey = song.measures[1].key,
            span = song.sequenceSpan(sequence, measureKey, 5, 1),
            flattened = song.flattenSequenceSpans(span.sequence)

        expect(flattened[0]).toEqual(
            expect.objectContaining({
                p: 1,
                d: 1,
                i: 4,
                f: 4
            })
        )

        expect(flattened[1]).toEqual(
            expect.objectContaining({
                p: 2,
                d: 1,
                i: 4,
                f: 4
            })
        )

        expect(flattened[2]).toEqual(
            expect.objectContaining({
                p: 3,
                d: 1,
                i: 8,
                f: 4
            })
        )
    })

    test('updateSequence', () => {
        const sequence = song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            measureKey = song.measures[1].key


        const span1 = song.sequenceSpan(sequence, measureKey, 5, 1),
            updated1 = song.updateSequence(span1)

        
        expect(updated1[0]).toEqual(
            expect.objectContaining({
                p: 1,
                d: 5,
                i: 8,
                f: 4
            })
        )

        const span2 = song.sequenceSpan(sequence, measureKey, 5, 2.5),
            updated2 = song.updateSequence(span2)

        expect(updated2[0]).toEqual(
            expect.objectContaining({
                p: 2.5,
                d: 3,
                i: 8,
                f: 4
            })
        )

        expect(updated2[1]).toEqual(
            expect.objectContaining({
                p: 0,
                d: 1,
                i: 4,
                f: 4
            })
        )
    })


    test('analyzeSequence', () => {
        const sequence = song.getNoteSequence(song.measures[1].strings[5][0].key, song.measures[1].key),
            measureKey = song.measures[1].key

        const span1 = song.sequenceSpan(sequence, measureKey, 5, 0),
            a1 = song.analyzeSequence(span1.sequence, 0)

        expect(a1[0]).toEqual(
            expect.objectContaining({
                start: 0,
                stop: 2.5,
                f: 4
            })
        )

        const span2 = song.sequenceSpan(sequence, measureKey, 1, 1.5),
            a2 = song.analyzeSequence(span2.sequence, 2)

        expect(a2[0]).toEqual(
            expect.objectContaining({
                start: 3.5,
                stop: 6,
                f: 4
            })
        )

        const a3 = song.analyzeSequence(span2.sequence, 6)
        expect(a3[0]).toEqual(
            expect.objectContaining({
                start: 7.5,
                stop: 10,
                f: 4
            })
        )
    })

    test('distanceToDurationAndInterval', () => {
        expect(song.distanceToDurationAndInterval(1, song.measures[1])).toEqual(
            expect.objectContaining({
                d: 1,
                i: 4,
            })
        )

        expect(song.distanceToDurationAndInterval(0.5, song.measures[1])).toEqual(
            expect.objectContaining({
                d: 1,
                i: 8,
            })
        )

        expect(song.distanceToDurationAndInterval(0.25, song.measures[1])).toEqual(
            expect.objectContaining({
                d: 1,
                i: 16,
            })
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


    test('movePositionList', () => {
        const distance = song.findDistance(song.measures[0].key, 1, song.measures[1].key, 1)

        expect(song.movePositionList(song.measures[0], 2, distance)).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 2,
                measureIndex: 1
            })
        )

        expect(song.movePositionList(song.measures[1], 3.5, distance)).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 3.5,
                measureIndex: 2
            })
        )

        const distance2 = song.findDistance(song.measures[0].key, 0.5, song.measures[2].key, 1)

        expect(song.movePositionList(song.measures[0], 1, distance2)).toEqual(
            expect.objectContaining({
                d: 0,
                i: 4,
                p: 1.5,
                measureIndex: 2
            })
        )
    })
})