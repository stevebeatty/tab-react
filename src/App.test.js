import React from 'react';
import ReactDOM from 'react-dom';
import { App, Measure } from './App';
import Layout from './Layout';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<App />, div);
  ReactDOM.unmountComponentAtNode(div);
});

it('Measure test', () => {
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

    const m = <Measure measure={measure} layout={layout} duration={measure.d} interval={measure.i} selected={false} />
    
    expect(m.doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 7, d: 1, i: 4, p: 3 })).toEqual(false);
    expect(m.doNotesOverlap({ f: 1, d: 1, i: 4, p: 2 }, { f: 1, d: 1, i: 4, p: 2 })).toEqual(true);
});