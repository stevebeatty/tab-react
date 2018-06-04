class StringParser {
	
	constructor() {
		this.numbers = ['0','1','2','3','4','5','6','7','8','9'];
		this.stringNames = ['e', 'B', 'G', 'D', 'A', 'E'];
		this.effectNames = ['h', 'p', '/', '\\'];
	}
	
	setStringToParse(str) {
		this.string = str.trim();
		this.position = 0;
		this.index = 0;
		this.measureStarted = false;
		this.currentFretNumber = null;
		this.content = [];
		this.measures = [];
		this.stringName = null;
		this.dashLength = 0;
		this.beginSequenceIndex = 0;
		this.activeEffect = null;
	}
	
	hasMore() {
		return this.index < this.string.length;
	}
	
	parseNext() {
		var t = this.string[this.index];
		
		if (t === '-') {
			this.onDash();
		} else if (t === '|') {
			this.onMeasureLine();
		} else if (this.isStringName(t)) {
			this.onStringName(t);
		} else if (this.isNumber(t)) {
			this.onNumber(t);
		} else if (t === 'h') {
			this.onHammerOn();
		} else if (t === 'p') {
			this.onPullOff();
		} else if (t === '/') {
			this.onSlideUp();
		} else if (t === '\\') {
			this.onSlideDown();
		}

		this.index++;
		return t;
	}
	
	parseToMeasureLine() {
		var t = '';
		while (t != '|' && this.hasMore()) {
			t = this.parseNext();
		}
	}
	
	peakNext() {
		return this.string[this.index];
	}
	
	skipNext() {
		this.index++;
	}
	
	charactersToNextMeasureLine(maxChars) {
		const charsLeft = this.string.length - this.index - 1;
		const times = maxChars && maxChars < charsLeft ? maxChars : charsLeft;
		
		for (var i = 0; i <= times; i++) {
			if (this.string[i + this.index] === '|') {
				return i;
			}
		}
		
		return -1;
	}
	
	charactersToPreviousMeasureLine(maxChars) {
		const times = maxChars && maxChars < this.index ? maxChars : this.index;
		
		for (var i = 0; i <= times; i++) {
			if (this.string[this.index - i] === '|') {
				return i;
			}
		}
		
		return -1;
	}
	
	looksLikeString(str) {
		return /^\s*[A-Za-z]?\|\-*/.test(str);
	}
	
	isStringName(str) {
		return this.stringNames.indexOf(str) >= 0;
	}
	
	isNumber(str) {
		return this.numbers.indexOf(str) >= 0;
	}
	
	isEffect(str) {
		return this.effectNames.indexOf(str) >= 0;
	}
	
	lastWasNumber() {
		return this.currentFretNumber !== null
	}
	
	onStringName(name) {
		this.stringName = name;
	}
	
	onMeasureLine() {
		if (this.measureStarted) {
			this.checkForBoundary();
			
			this.measures.push({
				content: this.content,
				size: this.position
			});
			this.content = [];
		} else {
			this.measureStarted = true;
		}
		
		this.position = 0;
	}
	
	onDash() {
		this.checkForNote();
		
		if (this.dashLength === 0) {
			this.beginSequenceIndex = this.position;
		}
		
		this.dashLength++;
		this.position++;
	}
	
	onNumber(num) {
		this.checkForDashSequence();
		
		if (this.currentFretNumber === null) {
			this.currentFretNumber = num;
			this.beginSequenceIndex = this.position;
		} else {
			this.currentFretNumber += num;
		}
	}
	
	onHammerOn() {
		this.checkForBoundary();
		this.onActiveEffect('h');
	}
	
	onPullOff() {
		this.checkForBoundary();
		this.onActiveEffect('p');
	}
	
	onSlideUp() {
		this.checkForBoundary();
		this.onActiveEffect('/');
	}
	
	onSlideDown() {
		this.activeEffect = '\\';
		this.checkForBoundary();
		this.onEffect('\\');
	}
	
	checkForBoundary() {
		this.checkForNote();
		this.checkForDashSequence();
	}
	
	checkForNote() {
		if (this.currentFretNumber !== null) {
			this.onNote(parseInt(this.currentFretNumber));
			this.currentFretNumber = null;
			this.position++;
		}
	}
	
	checkForDashSequence() {
		if (this.dashLength > 0) {
			this.content.push({p: this.beginSequenceIndex, d: this.dashLength});
			this.dashLength = 0;
		}
	}
	
	onActiveEffect(type) {
		this.activeEffect = type;
		//this.content.push({p: this.position, e: type, d: 1});
		this.onEffect(type);
	}
	
	onEffect(type) {
		//this.content.push({p: this.position, e: type, d: 1});
	}
	
	onNote(fret) {
		var note = {p: this.position, f: fret, d: 1};
		if (this.activeEffect !== null) {
			note.e = this.activeEffect;
			this.activeEffect = null;
		}
		this.content.push(note);
	}
	
	parseAll() {
		while (this.hasMore()) {
			this.parseNext();
		}
		
		this.checkForBoundary();
	}
}

export default StringParser;