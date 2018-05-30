class Measure {
	constructor(cfg) {
		this.key = cfg.key
		this.strings = cfg.strings
		this.i = cfg.i
		this.d = cfg.d

		const intervals = [cfg.i]

		for (var i=0; i < this.strings.length; i++) {
			var str = this.strings[i];
			for (var j=0; j < str.length; j++) {
				var o = str[j];
				if (o.i) {
					intervals.push(o.i);
				}
			}
		}
		const maxI = Math.max(...intervals);
		this.subdivisions = maxI/this.i;
	}

	doNotesOverlap(a, b) {
        const mi = this.i;
        //     b~~~~~~
        //            a~~~~
        // -----------------------------
        //     ^      ^
        //console.log(' | ', b.p + (b.d * mi / b.i), a.p, a.p + (a.d * mi / a.i), b.p);

        if (b.p <= a.p) {
            return b.p + (b.d * mi / b.i) > a.p
        } else {
            return a.p + (a.d * mi / a.i) > b.p;
        }               
    }

	nextNoteDistance(string, pos, skipIndex) {
        const notes = this.strings[string];

        //console.log('notes ', notes);
        for (let i = 0; i < notes.length; i++) {
            if (skipIndex === i) {
                continue
            }

            let n = notes[i]
            //console.log('n ', n, n.p + (n.d / n.i * this.props.interval), pos, this.props.interval );
            if (n.p < pos) {
                if (n.p + (n.d / n.i * this.i) > pos) {
                    return 0
                }
            } else {
                return n.p - pos;
            }
        }

        return -1;
    }

    nextNoteDistanceOrRemaining(string, pos, skipIndex) {
        const nextNoteDist = this.nextNoteDistance(string, pos, skipIndex)
        return nextNoteDist === -1 ? this.d - pos : nextNoteDist
    }

    prevNoteDistance(string, pos) {
        const notes = this.strings[string];
        const measureI = this.i / this.subdivisions;

        //console.log('notes ', notes);
        for (let i = notes.length - 1; i >= 0; i--) {
            let n = notes[i]
            //console.log('p ', n, n.p + (n.d / n.i * this.props.interval), pos);
            let extent = n.p + (n.d / n.i * this.i)
            //console.log('p ', pos, ' ? ', extent, n)
            if (n.p <= pos) {
                if (extent >= pos) {
                    return 0;
                } else {
                    return pos - extent
                }
            }
        }

        return -1;
    }

	validStringsForPosition(pos) {
        const valid = []
        for (let i = 0; i < this.strings.length; i++) {
            if (this.nextNoteDistance(i, pos) !== 0) {
                valid.push(i)
            }
        }

        return valid
    }

    addNote(string, note) {
        const notes = this.strings[string]

        if (!note.i) {
            note.i = this.i
        }

        notes.push(note)
        this.sortNotes(notes)

        return notes.indexOf(note)
    }

    removeNote(string, noteIndex) {
        const notes = this.strings[string]
        return notes.splice(noteIndex, 1)
    }

    sortNotes(arr) {
        arr.sort( (a, b) => a.p - b.p )
    }
}

class Song {
	constructor(cfg) {
		this.key = cfg.key
		this.i = cfg.i
		this.d = cfg.d
		this.measures = []

		for (let i = 0; i < cfg.measures.length; i++) {
            let m = new Measure(cfg.measures[i])
			this.measures.push(m)
        }
	}
}


export { Measure };