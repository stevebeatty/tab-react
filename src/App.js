import React, { Component } from 'react';
import './App.css';
import tab1 from './tab.js';
import Layout from './Layout.js';

console.log(tab1);

/*
 note:
 {
	 f // fret
	 d // duration
	 i // interval
 }
 
 */
var song = {
	name: 'Name',
	author: 'Author',
	d: 4,
	i: 4,
	measures: [
		{
			strings: [
				[{f: 1, d:1, i:4, p: 2}],
				[],
				[{f: 7, d:1, i:4, p: 3}],
				[],
				[],
				[]
			]
		},
		{
			strings: [
				[],
				[{f: 13, d:1, i:8, p: 1}],
				[],
				[{f: 4, d:1, i:4, p: 0}],
				[],
				[]
			]
		},
		{
			strings: [
				[],
				[{f: 13, d:1, i:16, p: 1}],
				[],
				[{f: 5, d:1, i:4, p: 0}],
				[{f: 14, d:1, i:8, p: 0.5}],
				[{f: 8, d:1, i:16, p: 1.25}]
			]
		}
	]
};

var layout = new Layout(); /*{
	topStringOffset: function() {
		return 1;
	},
	noteRadius: function() {
		return 0.6;
	},
	stringSpacing: function() {
		return this.noteRadius() * 2;
	},
	subdivisionOffset: function() {
		return this.noteRadius() * 2.5;
	},
	noteTextOffset: function () {
		return 0.3;
	},
	measureSideOffset: function () {
		return 1;
	},
	stringClickBoxHeight: function () {
        return 0.4 * this.stringSpacing();
	},
	measureClickBoxWidth: function() {
		return 0.6;
	}
};*/


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




class App extends Component {
	constructor(props) {
		super(props);
		
        this.measureIndex = this.processSong(song);
		
		this.state = {
			song: song,
			layout: layout,
            selectedMeasure: {},
            selectedNote: {},
            measureRef: React.createRef()
		};

        this.measureRef = React.createRef();

        this.handleMeasureSelect = this.handleMeasureSelect.bind(this);
        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleNoteClick = this.handleNoteClick.bind(this);
	}
	
	processSong(song) {
		var i = 1;
		for (var m = 0; m < song.measures.length; m++) {
			song.measures[m].key = i++;
		}
		
		return i;
	}
	
    handleMeasureSelect(measure) {
        console.log('click ' + Object.keys(measure.state));
		
		this.setState(prevState => ({
            selectedMeasure: measure.props.measure
		}));
	}

    clearSelectedMeasure() {
        this.setState({ selectedMeasure: {} });
    }

    findMeasureIndex(measure) {
        return this.state.song.measures.findIndex(x => x.key === measure.key);
    }

    newMeasure() {
        const strings = [];

        for (var m = 0; m < 6; m++) {
            strings.push([]);
        }

        return {
            key: this.measureIndex++,
            strings: strings
        };
    }

    insertNewBeforeSelectedMeasure() {
        const idx = this.findMeasureIndex(this.state.selectedMeasure);
        const strings = [];

        for (let m = 0; m < 6; m++) {
            strings.push([]);
        }

        const m = this.newMeasure();

        this.state.song.measures.splice(idx, 0, m);
        this.setState(prevState => ({
            song: this.state.song
        }));
    }

    handleStringClick(measure, stringIndex, e) {
        const bound = e.target.getBoundingClientRect(),
            x = e.clientX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistance(stringIndex, pos);

        if (dist !== 0) {
            measure.addNote(stringIndex, { p: pos, d: 1, f: 0 })

            this.setState({
                song: this.state.song
            });
        }

        console.log('handleStringClick ', stringIndex, x, w, pos, dist);
    }

    handleNoteClick(measure, stringIndex, noteIndex, e) {
        console.log('handleNoteClick ', noteIndex, stringIndex, measure.props.measure.key);
        this.setState({
            selectedNote: {
                measure: measure.props.measure.key,
                string: stringIndex,
                note: measure.props.measure.strings[stringIndex][noteIndex]
            }
        });
    }

    measureNeedsRef(measure) {
        const hasSelectedNote = this.state.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.state.selectedMeasure.key !== undefined;

        if (hasSelectedNote) {
            return measure.key === this.state.selectedNote.measure;
        } else if (hasSelectedMeasure) {
            return measure.key === this.state.selectedMeasure.key;
        } else {
            return false;
        }
    }

    render() {
        const hasSelectedNote = this.state.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.state.selectedMeasure.key !== undefined;

    //    console.log('selnote: ', this.state.selectedNote);
     //   console.log('layout2 ', this.state.layout);
    return (
	<div>
		<nav className="navbar navbar-default">
          <div className="container-fluid">
        <div className="navbar-header">
            <a className="navbar-brand" href="#">
                Tabulater
            </a>
        </div>
		   </div>
		</nav>
      <div className="container-fluid">
		<h4>{this.state.song.name}</h4>
		<h6>{this.state.song.author}</h6>
		
                {this.state.song.measures.map((measure, idx) => !this.measureNeedsRef(measure) ?

                    <Measure key={measure.key} measure={measure} layout={this.state.layout} duration={measure.d || this.state.song.d} interval={measure.i || this.state.song.i}
                        onMeasureSelect={this.handleMeasureSelect} selected={false} onStringClick={this.handleStringClick} onNoteClick={this.handleNoteClick} />
                    :

                    <Measure key={measure.key} forwardedRef={this.measureRef} measure={measure} layout={this.state.layout} duration={measure.d || this.state.song.d} interval={measure.i || this.state.song.i}
                        onMeasureSelect={this.handleMeasureSelect} selected={measure.key === this.state.selectedMeasure.key} onStringClick={this.handleStringClick} onNoteClick={this.handleNoteClick} selectedNote={this.state.selectedNote} />
                )}

                {hasSelectedMeasure ? <MeasureEditor measureRef={this.measureRef} measure={this.state.selectedMeasure} controller={this} /> : ''}
                {hasSelectedNote ? <NoteEditor measureRef={this.measureRef} note={this.state.selectedNote} controller={this} /> : ''}

      </div>
	</div>
    );
  }
}

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

        console.log('? ', noteIndex, stringIndex, this.props.selectedNote);

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
            clm = Math.min(this.props.duration + 1 - subSize, rnd);

        console.log('closestPosition: ', xNormalized, widEm, xPos, pos, clm);

        return clm;
    }

    nextNoteDistance(string, pos) {
        const notes = this.props.measure.strings[string];
        let min = -1;
        console.log('notes ', notes);
        for (let i = 0; i < notes.length; i++) {
            let n = notes[i];
            console.log('n ', n, pos);
            if (n.p < pos) {
                if (n.p + (n.d/n.i) > pos) {
                    return 0;
                }
            } else {
                return n.p - pos;
            }
        }

        return -1;
    }

    addNote(string, note) {
        const notes = this.props.measure.strings[string];

        if (!note.i) {
            note.i = this.state.subdivisions;
        }

        notes.push(note);
        this.sortNotes(notes);
    }

    sortNotes(arr) {
        arr.sort( (a, b) => {
            return a.p - b.p;
        });
    };

    render() {
	  const noteTextOffset = this.props.layout.noteTextOffset();
	  const beginningOffset = this.props.layout.measureSideOffset();
	  const subDivSize = this.props.layout.subdivisionOffset();
      const clickBoxHeight = this.props.layout.stringClickBoxHeight();

        console.log('sel note ', this.props.measure.key, ' ', this.props.selectedNote);

      const refAtt = {};
      if (this.props.forwardedRef) {
          refAtt.ref = this.props.forwardedRef;
          console.log('measure ref: ', this.props.measure.key, ' :',  refAtt);
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
                              d={this.noteDurationSize(note) + 'em'} index={nidx} onClick={this.handleNoteClick} selected={this.isNoteSelected(nidx, idx)} />
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
                r={layout.noteRadius() + 'em'} />}
	  
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

class MeasureEditor extends Component {

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.insertBefore = this.insertBefore.bind(this);
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        this.updatePosition();
        window.addEventListener("resize", this.updatePosition);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updatePosition);
    }

    componentDidUpdate(prevProps) {
        console.log('did update, old props:', prevProps);
        console.log('new props:', this.props);
        this.updatePosition();
    }

    updatePosition() {
        if (this.props.measureRef.current) {
            const rect = this.props.measureRef.current.getBoundingClientRect();
            console.log(rect.top, rect.right, rect.bottom, rect.left);

            const style = this.editorRef.current.style;
            style.position = 'absolute';
            style.top = rect.bottom + 'px';
            style.left = rect.left + 'px';
        }
    }

    insertBefore() {
        this.props.controller.insertNewBeforeSelectedMeasure();
    }

    render() {

        return (
            <div ref={this.editorRef} className="measure-edit-panel panel panel-primary" >
                <div className="panel-body form-inline">
                    <form>
                        <button type="button" className="close pull-right" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="form-group">
                            <label>Insert Empty</label>
                            <button type="button" onClick={this.insertBefore} className="btn btn-default" aria-label="">
                                <span aria-hidden="true">Before</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}

class NoteEditor extends Component {

    constructor(props) {
        super(props);
        this.editorRef = React.createRef();

        this.updatePosition = this.updatePosition.bind(this);
        this.insertBefore = this.insertBefore.bind(this);
    }

    componentDidMount() {
        console.log('mounted:', this.props);
        this.updatePosition();
        window.addEventListener("resize", this.updatePosition);
    }

    componentWillUnmount() {
        window.removeEventListener("resize", this.updatePosition);
    }

    componentDidUpdate(prevProps) {
        console.log('did update, old props:', prevProps);
        console.log('new props:', this.props);
        this.updatePosition();
    }

    updatePosition() {
        if (this.props.measureRef.current) {
            const rect = this.props.measureRef.current.getBoundingClientRect();
            console.log(rect.top, rect.right, rect.bottom, rect.left);

            const style = this.editorRef.current.style;
            style.position = 'absolute';
            style.top = rect.bottom + 'px';
            style.left = rect.left + 'px';
        }
    }

    insertBefore() {
        this.props.controller.insertNewBeforeSelectedMeasure();
    }

    render() {

        return (
            <div ref={this.editorRef} className="panel panel-default" >
                <div className="panel-body form-inline">
                    <form>
                        <button type="button" className="close pull-right" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <div className="form-group">
                            <label>String</label>
                            {this.props.note.string}
                        </div>
                        <div className="form-group">
                            <label>Interval</label>
                            {this.props.note.note.i}
                        </div>
                        <div className="form-group">
                            <label>Fret</label>
                            {this.props.note.note.f}
                        </div>
                    </form>
                </div>
            </div>
        )
    }
}


export { App, Measure };
