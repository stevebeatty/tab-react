import StringParser from './StringParser.js';

class TabParser {
	
	constructor() {
		this.lines = [];
		this.parser = new StringParser();
		this.setStringCount(6);
		this.song = {
			measures: []
		};
		this.indicies = {
		}
	}
	
	setStringCount(count) {
		this.parsers = new Array(count);
		for (var i = 0; i < count; i++) {
			this.parsers[i] = new StringParser();
		}
	}
	
	setTabToParse(str) {
		const trimmed = str.trim();
		this.lines = trimmed.split(/\s*[\n\r]\s*/);
		this.nextIndex = 0;
	}
	
	beginNextBlock() {
		for (var i = 0; i < this.parsers.length; i++) {
			this.parsers[i].setStringToParse(this.lines[this.nextIndex + i]);
		}
	}
	
	peakNext() {
		const result = new Array(this.parsers.length);
		
		for (var i = 0; i < this.parsers.length; i++) {
			result[i] = this.parsers[i].peakNext();
		}
		
		return result;
	}
	
	skipNext() {
		for (var i = 0; i < this.parsers.length; i++) {
			this.parsers[i].skipNext();
		}
	}
	
	parseToMeasureLine() {
		for (var i = 0; i < this.parsers.length; i++) {
			this.parsers[i].parseToMeasureLine();
		}
	}
	
	peakNext() {
		const result = new Array(this.parsers.length);
		
		for (var i = 0; i < this.parsers.length; i++) {
			result[i] = this.parsers[i].peakNext();
		}
		
		return result;
	}
	
	nextIsOnlyDashes() {
		const n = this.peakNext();
		for (var i = 0; i < n.length; i++) {
			if (n[i] !== '-') {
				return false;
			}
		}
		
		return true;
	}

	nextIsOnlyContinuation() {
		const n = this.peakNext();
		for (var i = 0; i < n.length; i++) {
			const ni = n[i];
			if (this.parsers[i].isNumber(ni)) {
				if (!this.parsers[i].lastWasNumber()) {
					return false;
				}
			} else if (!this.parsers[i].isEffect(ni) && ni !== '-') {
				return false;
			}
		}
		
		return !this.nextIsOnlyDashes();
	}
	
	parseNext() {
		const result = new Array(this.parsers.length);
		
		for (var i = 0; i < this.parsers.length; i++) {
			result[i] = this.parsers[i].parseNext();
		}
		
		return result;
	}
	
	parseContinuation() {
		const result = new Array(this.parsers.length);
		
		for (var i = 0; i < this.parsers.length; i++) {
			const parser = this.parsers[i];
			const n = parser.peakNext();
			if (parser.isEffect(n) || parser.isNumber(n) && parser.lastWasNumber()) {
				parser.parseNext();
			} else {
				parser.skipNext();
			}
		}
		
		return result;
	}
	
	parseBlock() {
		
		while (this.hasMoreCharacters()) {
		//	console.log(this.peakNext());
			if (this.nextIsOnlyContinuation()) {
		//		console.log('continue');
				this.parseContinuation();
			} else {
		//		console.log('   ' +  this.nextIsOnlyDashes() + ' ' + this.measureLineAfterNext() + ' ' + this.measureLineBefore());
				if (this.nextIsOnlyDashes() && 
					(this.measureLineAfterNext() ||	this.measureLineBefore())) {
		//				console.log('skip ' + this.measureLineAfterNext() + ' ' + this.measureLineBefore());
					this.skipNext();
				} else {
		//			console.log('parse');
					this.parseNext();
				}
			}
		}
	}
	
	parseNextLine() {
		// scrub out non tab lines
		
		this.parser.setStringToParse(this.lines[this.nextIndex]);
		this.parser.parseAll();
		
		var idx = 0;
		if (this.parser.stringName in this.indicies) {
			idx = this.indicies[this.parser.stringName];
		} 
		
		var count = idx + this.parser.measures.length;
		
		while (count > this.song.measures.length) {
			this.song.measures.push({ strings: [] });
		}
		
		for (var i = 0; i < this.parser.measures.length; i++) {
			var m = this.parser.measures[i];
			//this.song.measures[idx + i].strings.push(m.content);
			this.addContent(this.song.measures[idx + i].strings, m);
		}
		
		this.indicies[this.parser.stringName] = idx;
		
		this.nextIndex++;
		
		return this.parser.measures;
	}
	
	addContent(strings, m) {
		for (var i = 0; i < m.content.length; i++) {
			var o = m.content[i];
			if ('f' in o) {
				strings.push(o);
			}
		}
	}
	
	measureLineAfterNext() {
		for (var i = 0; i < this.parsers.length; i++) {
			if (this.parsers[i].charactersToNextMeasureLine(1) !== 1) {
				return false;
			}
		}
		
		return true;
	}
	
	measureLineBefore() {
		for (var i = 0; i < this.parsers.length; i++) {
			if (this.parsers[i].charactersToPreviousMeasureLine(1) !== 1) {
				return false;
			}
		}
		
		return true;
	}
	
	hasMoreCharacters() {
		for (var i = 0; i < this.parsers.length; i++) {
			if (!this.parsers[i].hasMore()) {
				return false;
			}
		}
		
		return true;
	}
	
	hasMoreLines() {
		return this.nextIndex < this.lines.length;
	}
	
	parseAll() {
		while (this.hasMoreLines()) {
			this.parseNext();
		}
	}
}

export default TabParser;