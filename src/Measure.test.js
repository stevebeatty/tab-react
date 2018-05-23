import React from 'react';
import { App, Measure } from './App';
import Layout from './Layout';
import Enzyme, { mount, shallow } from "enzyme";
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('Measure test', () => {
    const layout = new Layout();
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
        const m = shallow(<Measure measure={measure} layout={layout} duration={measure.d} interval={measure.i} selected={false} />);


        expect(m.instance().doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 1, d: 1, i: 4, p: 2 })).toEqual(true);
        expect(m.instance().doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
        expect(m.instance().doNotesOverlap({ f: 1, d: 2, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(true);
        expect(m.instance().doNotesOverlap({ f: 1, d: 2, i: 8, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
    });

    test('closestPosition', () => {
        const m = shallow(<Measure measure={measure} layout={layout} duration={measure.d} interval={measure.i} selected={false} />);
        const subEms = 4 * layout.subdivisionOffset() * 4,
            wid = layout.measureSideOffset() + subEms,
            s = 1 / 7,
            subSize = (1 - s) / 4;

        expect(m.instance().closestPosition(s + 2 * subSize)).toEqual(2);
        expect(m.instance().closestPosition(s + subSize)).toEqual(1);
        expect(m.instance().closestPosition(s + 3 * subSize)).toEqual(3);

        expect(m.instance().closestPosition(s + 1.5 * subSize)).toEqual(2);
        expect(m.instance().closestPosition(s + 1.75 * subSize)).toEqual(2);
    });

    test('nextNoteDistance', () => {
        const m = shallow(<Measure measure={measure} layout={layout} duration={measure.d} interval={measure.i} selected={false} />);

        expect(m.instance().nextNoteDistance(0, 1)).toEqual(1);
        expect(m.instance().nextNoteDistance(0, 2)).toEqual(0);
        expect(m.instance().nextNoteDistance(0, 2.125)).toEqual(0);
        expect(m.instance().nextNoteDistance(0, 2.5)).toEqual(0);
        expect(m.instance().nextNoteDistance(0, 3)).toEqual(-1);

        expect(m.instance().nextNoteDistance(1, 1)).toEqual(-1);
        expect(m.instance().nextNoteDistance(1, 2)).toEqual(-1);
        expect(m.instance().nextNoteDistance(1, 2.5)).toEqual(-1);
        expect(m.instance().nextNoteDistance(1, 3)).toEqual(-1);

    });

    test('prevNoteDistance', () => {
        const m = shallow(<Measure measure={measure} layout={layout} duration={measure.d} interval={measure.i} selected={false} />);
        expect(m.instance().prevNoteDistance(0, 1)).toEqual(-1);
        expect(m.instance().prevNoteDistance(0, 2)).toEqual(0);
        expect(m.instance().prevNoteDistance(0, 2.5)).toEqual(0);
        expect(m.instance().prevNoteDistance(0, 3)).toEqual(0);
        expect(m.instance().prevNoteDistance(0, 4)).toEqual(1);

        expect(m.instance().prevNoteDistance(1, 1)).toEqual(-1);
        expect(m.instance().prevNoteDistance(1, 2)).toEqual(-1);
        expect(m.instance().prevNoteDistance(1, 3)).toEqual(-1);

        console.log('strs ', m.instance().validStringsForPosition(3));
        console.log('strs ', m.instance().validStringsForPosition(2));
    });
});