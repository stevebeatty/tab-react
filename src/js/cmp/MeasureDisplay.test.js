import React from 'react';
import MeasureDisplay from './MeasureDisplay';
import { Measure } from './Model'
import Layout from './Layout';
import Enzyme, { mount, shallow } from "enzyme";
import Adapter from 'enzyme-adapter-react-16';

Enzyme.configure({ adapter: new Adapter() });

describe('Measure test', () => {
    const layout = new Layout();
    const measure = new Measure({
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
    });

    test('closestPosition', () => {
        const m = shallow(<MeasureDisplay measure={measure} layout={layout} duration={measure.d} interval={measure.i} selected={false} />);
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

});