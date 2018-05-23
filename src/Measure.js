import React, { Component } from 'react';


var rulers = {};
function getRuler(intervals, subdivisions) {

	const idx = intervals + '/' + subdivisions;

	if (idx in rulers) {
		return rulers[idx];
	} else {
		var arr;
		if (subdivisions === 1) {
			arr = new Array(intervals).fill(1);
		} else {
			const r = getRuler(intervals, subdivisions / 2).slice();
			
			// insertBetween
			const newSize = r.length * 2;
			if (newSize === 1) {
				return r;
			}
			
			arr = new Array(newSize);
			for (var i = 0; i < r.length; i++) {
				arr[2 * i] = r[i];
				arr[2 * i + 1] = subdivisions;
			}
			//arr[newSize - 1] = r[r.length - 1];
		}
		
		rulers[idx] = arr;
		return arr;
	}
};



class Measure extends Component {
	constructor(props) {
		super(props);
        
		const intervals = [this.props.interval];
		const strings = this.props.measure.strings;
		for (var i=0; i < strings.length; i++) {
			var str = strings[i];
			for (var j=0; j < str.length; j++) {
				var o = str[j];
				if (o.i) {
					intervals.push(o.i);
				}
			}
		}
		const maxI = Math.max(...intervals);
		const subdivisions = maxI/this.props.interval;

        //console.log(' & ', maxI, subdivisions)

		this.state = {
			subdivisions: subdivisions,
			isClicked: false
		};
		
        this.handleClick = this.handleClick.bind(this);
        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleNoteClick = this.handleNoteClick.bind(this);

        
	}
	
	stringYOffset(stringNum) {
		const layout = this.props.layout;
		return layout.topStringOffset() + (stringNum - 1) * layout.stringSpacing();
	}
	
	rulerBottom() {
		return this.stringYOffset(this.props.measure.strings.length + 1) + 0.2*this.props.layout.stringSpacing();
	}
	
	measureHeight() {
		return this.rulerBottom() + this.props.layout.topStringOffset();
	};
		
	measureWidth() {
		const layout = this.props.layout;
        return layout.measureSideOffset() + this.state.subdivisions * layout.subdivisionOffset() * this.props.duration;
    };
	
	noteXPosition(note) {
		const beginningOffset = this.props.layout.measureSideOffset();
	    const subDivSize = this.props.layout.subdivisionOffset();
		
		return beginningOffset + note.p * subDivSize * this.state.subdivisions;
	}
	
	noteDurationSize(note) {
	    const subDivSize = this.props.layout.subdivisionOffset();
		
		return note.d * subDivSize * this.state.subdivisions * this.props.interval / note.i;
	}
	
	handleClick() {
		this.props.onMeasureSelect(this);
    }

    handleStringClick(index, e) {
        this.props.onStringClick(this, index, e);
    }

    handleNoteClick(string, index, e) {
       // this.props.onStringClick(this, index, e);
        console.log("noteClick ", string, index);
        this.props.onNoteClick(this, string, index, e);
    }

    isNoteSelected(noteIndex, stringIndex) {
        //console.log(this.props.selectedNote);
        if (!this.props.selectedNote) return false;

        //console.log('? ', noteIndex, stringIndex, this.props.selectedNote);

        return this.props.selectedNote &&
            this.props.selectedNote.note === noteIndex &&
            this.props.selectedNote.string === stringIndex;
    }

    doNotesOverlap(a, b) {
        const mi = this.props.measure.i;
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

    /**
     * Finds the closest position to a valid subdivision 
     * 
     * @param {any} xNormalized the position normalized to the width of the measure
     */
    closestPosition(xNormalized) {
        const layout = this.props.layout,
            widEm = this.measureWidth(),
            xPos = Math.min(Math.max(xNormalized * widEm, layout.measureSideOffset()), widEm - layout.measureSideOffset()),
            pos = (xPos - layout.measureSideOffset()) / (layout.subdivisionOffset() * this.state.subdivisions),
            subSize = 1 / this.state.subdivisions,
            remain = pos % 1,
            remainSubs = Math.floor(remain / subSize),
            fr = Math.round((remain % subSize) / subSize),
            rnd = Math.floor(pos) + remainSubs * subSize + fr * subSize,
            closestInMeasure = Math.min(this.props.duration + 1 - subSize, rnd);

        console.log('closestPosition: ', xNormalized, widEm, xPos, pos, closestInMeasure);

        return closestInMeasure;
    }

    nextNoteDistance(string, pos, skipIndex) {
        const notes = this.props.measure.strings[string];

        //console.log('notes ', notes);
        for (let i = 0; i < notes.length; i++) {
            if (skipIndex === i) {
                continue
            }
            let n = notes[i];
            //console.log('n ', n, n.p + (n.d / n.i * this.props.interval), pos, this.props.interval );
            if (n.p < pos) {
                if (n.p + (n.d / n.i * this.props.interval) > pos) {
                    return 0;
                }
            } else {
                return n.p - pos;
            }
        }

        return -1;
    }

    nextNoteDistanceOrRemaining(string, pos, skipIndex) {
        const nextNoteDist = this.nextNoteDistance(string, pos, skipIndex)
        return nextNoteDist === -1 ? this.props.duration - pos : nextNoteDist
    }

    prevNoteDistance(string, pos) {
        const notes = this.props.measure.strings[string];
        const measureI = this.props.interval / this.state.subdivisions;

        //console.log('notes ', notes);
        for (let i = notes.length - 1; i >= 0; i--) {
            let n = notes[i];
            //console.log('p ', n, n.p + (n.d / n.i * this.props.interval), pos);
            let extent = n.p + (n.d / n.i * this.props.interval);
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
        for (let i = 0; i < this.props.measure.strings.length; i++) {
            if (this.nextNoteDistance(i, pos) !== 0) {
                valid.push(i)
            }
        }

        return valid
    }

    addNote(string, note) {
        const notes = this.props.measure.strings[string];

        if (!note.i) {
            note.i = this.props.interval;
        }

        notes.push(note);
        this.sortNotes(notes);

        return notes.indexOf(note);
    }

    removeNote(string, noteIndex) {
        const notes = this.props.measure.strings[string];
        return notes.splice(noteIndex, 1)
    }

    sortNotes(arr) {
        arr.sort( (a, b) => a.p - b.p);
    };

    render() {
	  const noteTextOffset = this.props.layout.noteTextOffset();
	  const beginningOffset = this.props.layout.measureSideOffset();
	  const subDivSize = this.props.layout.subdivisionOffset();
      const clickBoxHeight = this.props.layout.stringClickBoxHeight();

        //console.log('sel note ', this.props.measure.key, ' ', this.props.selectedNote);

      const refAtt = {};
      if (this.props.forwardedRef) {
          refAtt.ref = this.props.forwardedRef;
          //console.log('measure ref: ', this.props.measure.key, ' :',  refAtt);
      }
      
      return (
          <svg key={this.props.measure.key} className="measure" width={this.measureWidth() + 'em'} height={this.measureHeight() + 'em'} alt={this.props.selected.toString()} {...refAtt}>

		      <g className="strings">
                      {this.props.measure.strings.map((str, idx) =>
                          <String key={idx} index={idx} offset={this.stringYOffset(idx + 1)} boxHeight={clickBoxHeight} onClick={this.handleStringClick} />
			    )}
		      </g>
		  
		      <g className="etc">
                <line className="measure-begin" x1="1" x2="1" 
                      y1={this.stringYOffset(1) + 'em'} onClick={this.handleClick}
                      y2={this.stringYOffset(this.props.measure.strings.length) + 'em'} />
			    <rect className={"transparent clickable" + (this.props.selected ? ' selected-measure' : '')}
                      x1="1" y={this.stringYOffset(1) + 'em'} onClick={this.handleClick}
                      width={this.props.layout.measureClickBoxWidth() + 'em'} 
                      height={(this.props.measure.strings.length - 1) * this.props.layout.stringSpacing() + 'em'} />
              </g>

		    <Ruler y={this.rulerBottom()} d={this.props.duration} dx={beginningOffset} subdivisions={this.state.subdivisions} subdivisionSpacing={subDivSize}/>
		    <g className="notes">
			
			    {this.props.measure.strings.map((str, idx) => (
                          str.map((note, nidx) =>
                              <Note key={idx + '-' + nidx} x={this.noteXPosition(note)} y={this.stringYOffset(idx + 1)} fret={note.f} string={idx} dy={noteTextOffset}
                                  d={this.noteDurationSize(note) + 'em'} index={nidx} onClick={this.handleNoteClick} selected={this.isNoteSelected(nidx, idx)}
                                  layout={this.props.layout}/>
				    )
			    ))}
			
		    </g>
	      </svg>
	  )
  }
}




class String extends Component {
	
	constructor(props) {
		super(props);

		// This binding is necessary to make `this` work in the callback
		this.handleClick = this.handleClick.bind(this);
	  }
	  
    handleClick(e) {
        this.props.onClick(this.props.index, e);
	  }
	
    render() {
	    const offset = this.props.offset + 'em';
	  
	    return (
		<g>
			<line className="string clickable"  x1="0" x2="100%" y1={offset} y2={offset} onClick={this.handleClick}/>
			<rect className="transparent clickable" onClick={this.handleClick}
						    x1="0" y={this.props.offset - this.props.boxHeight/2 + 'em'}
						    width="100%" height={this.props.boxHeight + 'em'} />
		</g>
	    )
    }
}

class Ruler extends Component {
	
	tickXPostition(index) {
		return this.props.dx + (index * this.props.subdivisionSpacing);
	}
	
	tickHeight(index, subdivs) {
		return this.props.y - 0.15 * this.props.subdivisionSpacing - 0.65 * this.props.subdivisionSpacing / subdivs;
	}
	
    render() {
  
	    const ticks = getRuler(this.props.d, this.props.subdivisions);
	  
	    return (
		<g className="ruler">
            <line className="string"
                    x1="0" y1={this.props.y + 'em'}
                    x2="100%" y2={this.props.y + 'em'}
                    />
			<g>
			{ticks.map((i, idx) => (
				<line key={idx} className={"ruler-tick ruler-tick-" + i}
					    x1={this.tickXPostition(idx) + 'em'} 
					    x2={this.tickXPostition(idx) + 'em'} 
					    y1={this.tickHeight(idx, i) + 'em'}
					    y2={this.props.y + 'em'}
				/>
			))}
			
			
			</g>
		</g>
	    )
    }
}

class Note extends Component {

    constructor(props) {
        super(props);
        this.handleClick = this.handleClick.bind(this);
    }

    handleClick(e) {
        this.props.onClick(this.props.string, this.props.index, e);
    }

    render() {
	    const x = this.props.x + 'em';
	    const y = this.props.y + 'em';
	  
	    return (
	    <g>
            <rect className={"string-" + this.props.string}
                x={x}
			    y={this.props.y - 0.1 + 'em'}
                width={this.props.d} 
                    height="0.2em" />

            {this.props.selected &&
                <circle className="selected-note" cx={x}
                cy={y}
                r={this.props.layout.noteRadius() + 'em'} />}
	  
            <text className="note-text-outline clickable"
                x={x}
                y={y}
                dy={this.props.dy + 'em'}
                textAnchor="middle"
                onClick={this.handleClick}
			    >{this.props.fret}</text>
	  
		    <text className="note-text clickable"
			    x={x}
			    y={y}
			    dy={this.props.dy + 'em'} 
                textAnchor="middle"
                onClick={this.handleClick}
			    >{this.props.fret}</text>
	    </g>
	    )
    }
}

export { Measure as default };
