import TabParser from './TabParser.js';
import tab1 from './tab.js';

test('new should work', () => {
	var tp = new TabParser();
	tp.setTabToParse(tab1);
	console.log(tp.lines);
	//console.log(JSON.stringify(tp.parseNextLine()));
	//console.log(JSON.stringify(tp.parseNextLine()));
	
	tp.parseNextLine();
	console.log(JSON.stringify(tp.song));
	
	tp.parseNextLine();
	console.log(JSON.stringify(tp.song));
});

test('multiline', () => {
	var tp = new TabParser();
	tp.setTabToParse(tab1);

	tp.beginNextBlock();
	
	expect(tp.peakNext()).toEqual(['e', 'B', 'G', 'D', 'A', 'E']);
	
	tp.parseToMeasureLine();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	expect(tp.nextIsOnlyDashes()).toBe(true);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.skipNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '0']);
	expect(tp.nextIsOnlyDashes()).toBe(false);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	tp.parseNext();
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '9', '9', '-']);
	expect(tp.nextIsOnlyDashes()).toBe(false);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', 'h', '-']);
	expect(tp.nextIsOnlyDashes()).toBe(false);
	expect(tp.nextIsOnlyContinuation()).toBe(true);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '1', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '1', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(true);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '9', '9', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['9', '9', '9', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', 'h', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(true);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', '1', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '1', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(true);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', 'p', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(true);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', '9', '-', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(false);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '1', '-', '-']);
	
	tp.parseNext();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '1', '-', '-']);
	expect(tp.nextIsOnlyContinuation()).toBe(true);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '\\', '-', '-']);
	
	tp.parseContinuation();
	
	expect(tp.peakNext()).toEqual(['-', '-', '-', '-', '-', '-']);
	
	tp.skipNext();
	
	expect(tp.peakNext()).toEqual(['|', '|', '|', '|', '|', '|']);
	
	tp.parseNext();
	
	console.log(JSON.stringify(tp.parsers[2].measures, null, 2));
});


test('multiline', () => {
	var tp = new TabParser();
	tp.setTabToParse(tab1);

	tp.beginNextBlock();
	
	tp.parseBlock();
	
	for (var i = 0; i < tp.parsers.length; i++) {
	//	console.log(tp.parsers[i].hasMore());
	}
	
	console.log(JSON.stringify(tp.parsers[2].measures, null, 2));
});	