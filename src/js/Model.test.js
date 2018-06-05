
import { Measure, Song } from './Model';


describe('Measure test', () => {
    const measure = {
        i: 4,
        d: 4,
        tempo: 60,
        strings: [
            [{ f: 1, d: 1, i: 4, p: 2 }],
            [],
            [{ f: 7, d: 1, i: 4, p: 3 }],
            [],
            [],
            []
        ] 
    };

    test('doNotesOverlap', () => {
        const m = new Measure(measure)

        expect(m.doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 1, d: 1, i: 4, p: 2 })).toEqual(true);
        expect(m.doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
        expect(m.doNotesOverlap({ f: 1, d: 2, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(true);
        expect(m.doNotesOverlap({ f: 1, d: 2, i: 8, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
    });

    test('nextNoteDistance', () => {
        const m = new Measure(measure)

        expect(m.nextNoteDistance(0, 1)).toEqual(1);
        expect(m.nextNoteDistance(0, 2)).toEqual(0);
        expect(m.nextNoteDistance(0, 2.125)).toEqual(0);
        expect(m.nextNoteDistance(0, 2.5)).toEqual(0);
        expect(m.nextNoteDistance(0, 3)).toEqual(-1);

        expect(m.nextNoteDistance(1, 1)).toEqual(-1);
        expect(m.nextNoteDistance(1, 2)).toEqual(-1);
        expect(m.nextNoteDistance(1, 2.5)).toEqual(-1);
		expect(m.nextNoteDistance(1, 3)).toEqual(-1);

    });

    test('prevNoteDistance', () => {
        const m = new Measure(measure)

        expect(m.prevNoteDistance(0, 1)).toEqual(-1);
        expect(m.prevNoteDistance(0, 2)).toEqual(0);
        expect(m.prevNoteDistance(0, 2.5)).toEqual(0);
        expect(m.prevNoteDistance(0, 3)).toEqual(0);
        expect(m.prevNoteDistance(0, 4)).toEqual(1);

        expect(m.prevNoteDistance(1, 1)).toEqual(-1);
        expect(m.prevNoteDistance(1, 2)).toEqual(-1);
        expect(m.prevNoteDistance(1, 3)).toEqual(-1);

        console.log('strs ', m.validStringsForPosition(3));
        console.log('strs ', m.validStringsForPosition(2));
    });

    test('interval', () => {
        const m = new Measure(measure)

        expect(m.interval()).toEqual(4)
        expect(new Measure({}).interval()).toBeUndefined()
    })

    test('duration', () => {
        const m = new Measure(measure)

        expect(m.duration()).toEqual(4)
        expect(new Measure({}).duration()).toBeUndefined()
    })

    test('tempo', () => {
        const m = new Measure(measure)

        expect(m.tempo()).toEqual(60)
        expect(new Measure({}).tempo()).toBeUndefined()
    })

    test('totalTime', () => {
        const m = new Measure(measure)

        expect(m.totalTime()).toEqual(4)
    })

	test('noteWithIndex', () => {
		const m = new Measure(measure)
		expect(m.noteWithIndex(0, 0)).toBeDefined()
	})
});


describe('Song Class test', () => {
    var song;

    beforeEach(() => {
        song = {
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
                        [],
                        [{ f: 13, d: 1, i: 8, p: 1 }],
                        [],
                        [{ f: 4, d: 1, i: 4, p: 0 }],
                        [],
                        []
                    ]
                },
                {
                    strings: [
                        [],
                        [{ f: 13, d: 1, i: 16, p: 1 }],
                        [],
                        [{ f: 5, d: 1, i: 4, p: 0 }],
                        [{ f: 14, d: 1, i: 8, p: 0.5 }],
                        [{ f: 8, d: 1, i: 16, p: 1.25 }]
                    ]
                }
            ]
        }
    });

    test('constructor', () => {
        const s = new Song(song)

        expect(s.measures.length).toEqual(song.measures.length)
        expect(s.i).toEqual(song.i)
        expect(s.interval()).toEqual(song.i)

        expect(s.d).toEqual(song.d)
        expect(s.duration()).toEqual(song.d)

        expect(s.measures[0].strings.length).toEqual(6)
        expect(s.key).toBeDefined()

        s.measures.forEach((m) => {
            console.log('sdf', m.key)
            expect(m.key).toBeDefined()
            expect(s.measureWithKey(m.key)).toEqual(m)
        })

        expect(s.measureIndexWithKey(s.measures[0].key)).toEqual(0)
        expect(s.measureIndexWithKey(s.measures[1].key)).toEqual(1)
    });

    test('tempo', () => {
        const s = new Song(song)

        expect(s.tempo()).toEqual(60)
        expect(new Song({}).tempo()).toBeUndefined()
    })

    test('totalTime', () => {
        const s = new Song(song)

        expect(s.totalTime()).toEqual(4 * 3)
    })

    test('insertMeasureAtIndex', () => {
        const s = new Song(song)
        s.insertMeasureAtIndex(1, s.newMeasure())
        expect(s.measures.length).toEqual(song.measures.length + 1)

        s.measures[1].strings.forEach((s) => {
            expect(s.length).toEqual(0)
        })
    });
})