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



class MeasureDisplay extends Component {
	constructor(props) {
		super(props);
        
        //console.log(' & ', maxI, subdivisions)

		this.state = {
		};
		
        this.handleClick = this.handleClick.bind(this);
        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleNoteClick = this.handleNoteClick.bind(this);
        this.handleNoteDrag = this.handleNoteDrag.bind(this);
        this.handleStringDrop = this.handleStringDrop.bind(this);
		this.handleStringDragOver = this.handleStringDragOver.bind(this);
	}
	
	static getDerivedStateFromProps(props, state) {
		//console.log('getDerivedStateFromProps')

		const intervals = [props.measure.interval()];
		const strings = props.measure.strings;
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
        const subdivisions = maxI / props.measure.interval();

		const diff = {}

		if (subdivisions !== state.subdivisions) {
			return {
				subdivisions: subdivisions
			}
		}

		return null
	}

	stringYOffset(stringNum) {
		const layout = this.props.layout;
		return layout.topStringOffset() + (stringNum - 1) * layout.stringSpacing();
	}
	
	rulerBottom() {
		return this.stringYOffset(this.props.measure.strings.length + 1) + 0.4*this.props.layout.stringSpacing();
	}
	
	measureHeight() {
		return this.rulerBottom();
	};
		
	measureWidth() {
		const layout = this.props.layout;
        return layout.measureSideOffset() + this.state.subdivisions * layout.subdivisionOffset() * this.props.measure.duration();
    };
	
	noteXPosition(note) {
		const beginningOffset = this.props.layout.measureSideOffset();
	    const subDivSize = this.props.layout.subdivisionOffset();
		
		return beginningOffset + note.p * subDivSize * this.state.subdivisions;
	}
	
	noteDurationSize(note) {
	    const subDivSize = this.props.layout.subdivisionOffset();
		
        return note.d * subDivSize * this.state.subdivisions * this.props.measure.interval() / note.i;
	}
	
	handleClick() {
		this.props.onMeasureSelect(this);
    }

    handleStringClick(index, e) {
        this.props.onStringClick(this, index, e);
    }

	handleStringDrop(index, e) {
        this.props.onStringDrop(this, index, e);
    }

	handleStringDragOver(index, e) {
        this.props.onStringDragOver(this, index, e);
    }

    handleNoteClick(string, index, e) {
       // this.props.onStringClick(this, index, e);
        console.log("noteClick ", string, index);
        this.props.onNoteClick(this, string, index, e);
    }

    handleNoteDrag(e) {
        const bound = e.target.getBoundingClientRect(),
            x = e.clientX - bound.left,
            w = x / bound.width,
            pos = this.closestPosition(w)

        console.log('pos ', pos, e.clientX, e.clientY, e.target.getBoundingClientRect())
    }

    isNoteSelected(noteIndex, stringIndex) {
        return this.props.selection &&
            this.props.selection.type === 'note' &&
            this.props.selection.value.note === noteIndex &&
            this.props.selection.value.string === stringIndex &&
            this.props.selection.value.measure === this.props.measure.key;
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
            closestInMeasure = Math.min(this.props.measure.duration() + 1 - subSize, rnd);

        //console.log('closestPosition: ', xNormalized, widEm, xPos, pos, closestInMeasure);

        return closestInMeasure;
    }

    nextNoteDistanceOrRemaining(string, pos, skipIndex) {
        return this.props.measure.nextNoteDistanceOrRemaining(string, pos, skipIndex)
    }

    addNote(string, note) {
        return this.props.measure.addNote(string, note)
    }

    removeNote(string, noteIndex) {
        return this.props.measure.removeNote(string, noteIndex)
    }

    render() {
	  const noteTextOffset = this.props.layout.noteTextOffset();
	  const beginningOffset = this.props.layout.measureSideOffset();
	  const subDivSize = this.props.layout.subdivisionOffset();
      const clickBoxHeight = this.props.layout.stringClickBoxHeight();

        //console.log('sel note ', this.props.measure.key, ' ', this.props.selectedNote);

      const refAtt = {};
        if (this.props.forwardedRef) {
            refAtt.ref = this.props.forwardedRef;
           // console.log('measure ref: ', this.props.measure.key, ' :', refAtt);
        } else {
           // console.log('no ref')
        }
      
      return (
          <div key={this.props.measure.key} className="measure" {...refAtt}
               style={{ width: this.measureWidth() + 'em', height: this.measureHeight() + 'em' }}>

		      <div className="strings">
                      {this.props.measure.strings.map((str, idx) =>
                          <String key={idx} index={idx} offset={this.stringYOffset(idx + 1)} boxHeight={clickBoxHeight} onClick={this.handleStringClick}
								onDrop={this.handleStringDrop} onDragOver={this.handleStringDragOver} />
			    )}
		      </div>
		  
		      <div className="etc">
                  <div className="measure-begin" x1="1" x2="1" style={{
                      width: '1px', height: this.stringYOffset(this.props.measure.strings.length) - this.stringYOffset(1) + 'em', backgroundColor: 'black',
                      top: this.stringYOffset(1) + 'em', position: 'absolute'
                  }} />
				<div className={"transparent clickable" + (this.props.selected ? ' selected-measure' : '')}
                        onClick={this.handleClick}
                      style={{
                          position: 'absolute',
                          width: this.props.layout.measureClickBoxWidth() + 'em', 
                          height: (this.props.measure.strings.length - 1) * this.props.layout.stringSpacing() + 'em',
                          top: this.stringYOffset(1) + 'em',
                          zIndex: 40
                      }} />
              </div>

              
              <div className="notes" style={{ position: 'relative' }}>
			
			    {this.props.measure.strings.map((str, idx) => (
                      str.map((note, nidx) =>
                          <Note key={note.key} x={this.noteXPosition(note)} y={this.stringYOffset(idx + 1)} fret={note.f} string={idx} dy={noteTextOffset} measure={this.props.measure.key}
                              d={this.noteDurationSize(note)} index={nidx} onClick={this.handleNoteClick} selected={this.isNoteSelected(nidx, idx)}
                              onDrag={this.handleNoteDrag} onDragStart={this.props.onNoteDragStart} onDragEnd={this.props.onNoteDragEnd} canDrag={this.props.canDragNote}
                              layout={this.props.layout}  />
				    )
			    ))}
			
              </div>

              <Ruler y={this.rulerBottom()} d={this.props.measure.duration()} dx={beginningOffset} subdivisions={this.state.subdivisions} subdivisionSpacing={subDivSize}
                  width={this.measureWidth()} height={subDivSize} showIndicator={this.props.isPlaying} indicatorPosition={this.props.currentTime/this.props.measure.totalTime()}
				  totalTime={this.props.measure.totalTime()} />
	      </div>
	  )
  }
}




class String extends Component {
	
	constructor(props) {
		super(props);

		// This binding is necessary to make `this` work in the callback
        this.handleClick = this.handleClick.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
		this.handleDrop = this.handleDrop.bind(this);
	  }
	  
    handleClick(e) {
        this.props.onClick(this.props.index, e);
    }

    handleDragOver(evt) {
        //evt.preventDefault()
        //evt.dataTransfer.dropEffect = 'move'
		this.props.onDragOver(this.props.index, evt)
    }

	handleDrop(evt) {
        evt.preventDefault()
     
		this.props.onDrop(this.props.index, evt)
    }
	
    render() {
	    const offset = this.props.offset + 'em';
	  
        return (
            <div style={{ position: 'relative' }}  >
                <div className="string clickable" style={{ height: '1px', width: '100%', backgroundColor: 'black', position: 'absolute', top: offset }} onClick={this.handleClick} />
                <div className="clickable" onClick={this.handleClick} onMouseUp={this.handleMouseUp} onDragOver={this.handleDragOver}
					onDrop={this.handleDrop}
                    style={{ zIndex: 10,
                        height: 2 * this.props.boxHeight + 'em', position: 'absolute', top: this.props.offset - this.props.boxHeight  + 'em', width: '100%'  }} 
						    />
		</div>
	    )
    }
}

class Ruler extends Component {
	
	constructor(props) {
		super(props)

		this.state = {}

		this.indicatorRef = React.createRef()
	}


	componentDidUpdate(prevProps, prevState, snapshot) {
	//console.log('componentDidUpdate', prevState)

		if (prevProps.showIndicator && !prevState.isShowingIndicator) {
			console.log('animate', this.props.totalTime)
			this.indicatorRef.current.animate([
			  // keyframes
			  { transform: 'translateX(0px)' }, 
			  { transform: 'translateX(' + this.props.width + 'em)' }
			], { 
			  // timing options
			  duration: this.props.totalTime * 1000,
			  iterations: 1
			});

			this.setState( {
				isShowingIndicator: true
			})

		}
		
	}

	tickXPostition(index) {
		return this.props.dx + (index * this.props.subdivisionSpacing);
	}
	
	tickHeight(index, subdivs) {
		return 0.8 * this.props.subdivisionSpacing - 0.65 * this.props.subdivisionSpacing / subdivs;
	}
	
    render() {
  
        const ticks = getRuler(this.props.d, this.props.subdivisions);
        const bottom = this.props.subdivisionSpacing - 0.1
	  
        return (
            <svg width={this.props.width + 'em'} height={this.props.height + 'em'} style={{ position: 'absolute', top: this.props.y - this.props.height + 'em' }}>
				<g className="ruler">
					<line className="string"
							x1="0" y1={bottom + 'em'}
							x2="100%" y2={bottom + 'em'}  />
					<g>
					{ticks.map((i, idx) => (
						<line key={idx} className={"ruler-tick"}
								x1={this.tickXPostition(idx) + 'em'} 
								x2={this.tickXPostition(idx) + 'em'} 
								y1={this.tickHeight(idx, i) + 'em'}
									y2={bottom + 'em'}
						/>
					))}
                    </g>

                    { <line className={"ruler-tick"} style={{ stroke: 'red' }}
                        x1={this.props.width * this.props.indicatorPosition + 'em'}
                        x2={this.props.width * this.props.indicatorPosition + 'em'}
                        y1={1 + 'em'}
                        y2={bottom + 'em'}
                    />}

					{ <line ref={this.indicatorRef} className={"ruler-tick"} style={{ stroke: 'blue' }}
                        x1={1+ 'em'}
                        x2={1 + 'em'}
                        y1={1 + 'em'}
                        y2={bottom + 'em'}
                    />}

				</g>
            </svg>
	    )
    }
}

class Note extends Component {

    constructor(props) {
        super(props)

        this.state = {
            isDragging: false
        }

        this.handleClick = this.handleClick.bind(this)
        this.handleDragStart = this.handleDragStart.bind(this)
        this.handleDragEnd = this.handleDragEnd.bind(this)
    }

    handleClick(e) {
        this.props.onClick(this.props.string, this.props.index, e)
    }

    handleDragStart(evt) {
        console.log('dragstart')

        this.props.onDragStart({
            measure: this.props.measure,
            string: this.props.string,
            note: this.props.index
        }, evt)

        this.setState({
            isDragging: true
        })
    }

    handleDragEnd(evt) {
        console.log('dragend')
        this.props.onDragEnd(evt)

        this.setState({
            isDragging: false
        })
    }


    render() {
        const rectHeight = 0.2,
            imgHeight = 1.5,
            imgLeft = .75,
            imgMiddle = imgHeight/2

        
	    const x = this.props.x + 'em';
	    const y = this.props.y + 'em';
	  
        return (
            <div draggable={this.props.canDrag} onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd}
                className={this.state.isDragging ? 'note-dragging' : 'note-default-state'}
                style={{
                    position: 'absolute',
                    width: this.props.d + imgLeft + 'em',
                    left: this.props.x - imgLeft + 'em',
                    top: this.props.y - imgHeight / 2 + 'em',
                    height: imgHeight + 'em'
                }}>
				<svg 
					 style={{ width: this.props.d + imgLeft + 'em', height: imgHeight + 'em' }}>

					<rect className={"string-" + this.props.string} 
							x={imgLeft + 'em'}
							y={imgMiddle - rectHeight/2 + 'em'}
							width={this.props.d + 'em'} 
							height="0.2em" />

					{this.props.selected &&
						<circle className="selected-note" cx={imgLeft + 'em'}
							cy={imgMiddle + 'em'}
						    r={this.props.layout.noteRadius() + 0.05 + 'em'} />}

					<text className="note-text-outline clickable"
							x={imgLeft + 'em'}
							y={imgMiddle + 'em'}
						dy={this.props.dy + 'em'}
						textAnchor="middle"
						onClick={this.handleClick}
						>{this.props.fret}</text>
	  
					<text className="note-text clickable" 
							x={imgLeft + 'em'}
							y={imgMiddle + 'em'}
						dy={this.props.dy + 'em'} 
						textAnchor="middle"
						onClick={this.handleClick}
						>{this.props.fret}</text>
				</svg>
            </div>
	    )
    }
}

export default MeasureDisplay
