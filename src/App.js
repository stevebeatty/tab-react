import React, { Component } from 'react';
import './App.css';
import tab1 from './tab.js';

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

var layout = {
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
	}

};


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
			const newSize = r.length * 2 - 1;
			if (newSize === 1) {
				return r;
			}
			
			arr = new Array(newSize);
			for (var i = 0; i < r.length - 1; i++) {
				arr[2 * i] = r[i];
				arr[2 * i + 1] = subdivisions;
			}
			arr[newSize - 1] = r[r.length - 1];
		}
		
		rulers[idx] = arr;
		return arr;
	}
};




class App extends Component {
	constructor(props) {
		super(props);
		
		this.processSong(song);
		
		this.state = {
			song: song,
			layout: layout
		};
	}
	
	processSong(song) {
		var i = 1;
		for (var m = 0; m < song.measures.length; m++) {
			song.measures[m].key = i++;
		}
		
		return i;
	}
	
	
  render() {
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
		
			 {this.state.song.measures.map((measure, idx) =>
				<Measure key={measure.key} measure={measure} layout={this.state.layout} duration={measure.d || this.state.song.d} interval={measure.i || this.state.song.i} />
			  )}
		
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
			subdivisions: subdivisions
		};
	}
	
	stringYOffset(stringNum) {
		const layout = this.props.layout;
		return layout.topStringOffset() + (stringNum - 1) * layout.stringSpacing()
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
	
	
	
  render() {

	  const noteTextOffset = this.props.layout.noteTextOffset();
	  const beginningOffset = this.props.layout.measureSideOffset();
	  const subDivSize = this.props.layout.subdivisionOffset();
	  
	  return (
	  <svg className="measure" width={this.measureWidth() + 'em'}>

		  <g className="strings">
			{this.props.measure.strings.map((str, idx) =>
				<String key={idx} index={idx} offset={this.stringYOffset(idx + 1) + 'em'}/>
			)}
		  </g>
		  
		  <g>
            <line className="measure-begin" x1="1" x2="1" 
                  y1={this.stringYOffset(1) + 'em'}
                  y2={this.stringYOffset(this.props.measure.strings.length) + 'em'} />
          </g>

		<Ruler y={this.rulerBottom()} d={this.props.duration} dx={beginningOffset} subdivisions={this.state.subdivisions} subdivisionSpacing={subDivSize}/>
		<g className="notes">
			
			{this.props.measure.strings.map((str, idx) => (
				str.map((note, nidx) =>
				<Note key={idx + '-' + nidx} x={this.noteXPosition(note)} y={this.stringYOffset(idx + 1)} fret={note.f} dy={noteTextOffset}
					d={this.noteDurationSize(note) + 'em'}/>
				)
			))}
			
		</g>
	  </svg>
	  )
  }
}

class String extends Component {
  render() {
	  return (
		<line className="string clickable" x1="0" x2="100%" y1={this.props.offset} y2={this.props.offset}/>
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
  render() {
	  const x = this.props.x + 'em';
	  const y = this.props.y + 'em';
	  
	  return (
	  <g>
		<rect className="string-1"
            x={x}
			y={this.props.y - 0.1 + 'em'}
            width={this.props.d} 
            height="0.2em" />
	  
		<text className="note-text-outline clickable"
			  x={x}
			  y={y}
			  dy={this.props.dy + 'em'}
			  textAnchor="middle"
			  >{this.props.fret}</text>
	  
		<text className="note-text clickable"
			  x={x}
			  y={y}
			  dy={this.props.dy + 'em'} 
			  textAnchor="middle"
			  >{this.props.fret}</text>
	</g>
	  )
  }
}




export default App;
