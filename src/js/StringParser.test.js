import StringParser from './StringParser.js';

test('new should work', () => {
	var sp = new StringParser();
});

test('string with only dashes should parse', () => {
	var sp = new StringParser();
	sp.setStringToParse('-----');
	
	expect(sp.index).toBe(0);
	
	while (sp.hasMore()) {
		sp.parseNext();
	}
	
	expect(sp.index).toBe(5);
});


test('string with notes should parse', () => {
	var sp = new StringParser();
	sp.setStringToParse('-1-');
	sp.parseAll();
	
	expect(sp.content[1].f).toBe(1);
});

test('string with two subsequent digits should parse as one note', () => {
	var sp = new StringParser();
	sp.setStringToParse('-13-');
	sp.parseAll();
	
	expect(sp.content[1].f).toBe(13);
	expect(sp.index).toBe(4);
});

test('string with digits separated by dashes should parse multiple notes', () => {
	var sp = new StringParser();
	sp.setStringToParse('-1-2-3');
	sp.parseAll();
	
	expect(sp.content.length).toBe(6);
});

test('starting measure line shouldn\'t change state', () => {
	var sp = new StringParser();
	sp.setStringToParse('|');
	sp.parseAll();
	
	expect(sp.content.length).toBe(0);
	expect(sp.measures.length).toBe(0);
});

test('two measure lines should mark a measure', () => {
	var sp = new StringParser();
	sp.setStringToParse('|-|');
	sp.parseAll();
	
	expect(sp.measures.length).toBe(1);
	expect(sp.content.length).toBe(0); // reset
});

test('setting string name should work', () => {
	var sp = new StringParser();
	sp.setStringToParse('B|----|');
	sp.parseAll();
	
	expect(sp.measures.length).toBe(1);
	expect(sp.stringName).toBe('B');
});

test('hammer on should register as two notes', () => {
	var sp = new StringParser();
	sp.setStringToParse('9h11');
	sp.parseAll();
	
	expect(sp.content.length).toBe(2);
	expect(sp.measures.length).toBe(0);
	expect(sp.content[0].f).toBe(9);
	expect(sp.content[1].f).toBe(11);
});

test('pull off should register as two notes', () => {
	var sp = new StringParser();
	sp.setStringToParse('12p10');
	sp.parseAll();
	
	expect(sp.content.length).toBe(2);
	expect(sp.measures.length).toBe(0);
	expect(sp.content[0].f).toBe(12);
	expect(sp.content[1].f).toBe(10);
});

test('slide up to note', () => {
	var sp = new StringParser();
	sp.setStringToParse('---/7--');
	sp.parseAll();
	
	expect(sp.content.length).toBe(3);
	expect(sp.content[1].f).toBe(7);
});

test('slide down from a note', () => {
	var sp = new StringParser();
	sp.setStringToParse('---9\\--');
	sp.parseAll();
	
	expect(sp.content.length).toBe(3);
	expect(sp.content[1].f).toBe(9);
});

test('slide between notes', () => {
	var sp = new StringParser();
	sp.setStringToParse('---9\\5--');
	sp.parseAll();
	
	expect(sp.content.length).toBe(4);
	expect(sp.content[1].f).toBe(9);
	expect(sp.content[2].f).toBe(5);
});

test('setting string name should work', () => {
	var sp = new StringParser();
	sp.setStringToParse('B|----|-1-2-3-|');
	sp.parseAll();
	
	expect(sp.measures.length).toBe(2);
	expect(sp.measures[0].content.length).toBe(1);
	expect(sp.measures[1].content.length).toBe(7);
});

test('charactersToMeasureLine', () => {
	var sp = new StringParser();
	sp.setStringToParse('B|----|-1-2-3-|');
	
	expect(sp.charactersToNextMeasureLine()).toBe(1);
	expect(sp.charactersToPreviousMeasureLine()).toBe(-1);
	
	sp.parseNext();
	
	expect(sp.charactersToNextMeasureLine()).toBe(0);
	expect(sp.charactersToPreviousMeasureLine()).toBe(0);
	expect(sp.charactersToPreviousMeasureLine(0)).toBe(0);
	
	sp.parseNext();
	
	expect(sp.charactersToNextMeasureLine()).toBe(4);
	expect(sp.charactersToPreviousMeasureLine()).toBe(1);
	expect(sp.charactersToNextMeasureLine(4)).toBe(4);
	expect(sp.charactersToNextMeasureLine(3)).toBe(-1);
	expect(sp.charactersToNextMeasureLine(2)).toBe(-1);
	
	sp.parseNext();
	
	expect(sp.charactersToPreviousMeasureLine()).toBe(2);
	expect(sp.charactersToPreviousMeasureLine(2)).toBe(2);
	expect(sp.charactersToPreviousMeasureLine(1)).toBe(-1);
});

test('peakNext should show the next character, but not advance position', () => {
	var sp = new StringParser();
	sp.setStringToParse('B|----|-1-2-3-|');
	expect(sp.peakNext()).toBe('B');
	expect(sp.peakNext()).toBe('B');
	
	sp.parseNext();
	expect(sp.peakNext()).toBe('|');
});

test('looksLikeString', () => {
	var sp = new StringParser();

	expect(sp.looksLikeString('B|--')).toBe(true);
	expect(sp.looksLikeString('')).toBe(false);
	expect(sp.looksLikeString('e|-1--|')).toBe(true);
	expect(sp.looksLikeString('  e|-1--|  ')).toBe(true);
	expect(sp.looksLikeString('eeeee|')).toBe(false);
});

test('skip should advance the position', () => {
	var sp = new StringParser();

	var sp = new StringParser();
	sp.setStringToParse('B|-1-2-3-|');
	sp.parseToMeasureLine();
	expect(sp.peakNext()).toBe('-');
	sp.skipNext();
	
	sp.parseAll();
	
	expect(sp.measures[0].content[0]).toEqual({p:0, f:1, d: 1});
	
	//console.log(JSON.stringify(sp.measures, null, 2));
});