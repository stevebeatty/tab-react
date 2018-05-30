
import { Measure } from './Model';


describe('Measure test', () => {
    const measure = {
        i: 4,
        d: 4,
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
});