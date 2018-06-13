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
            localRef: React.createRef()
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
		    diff.subdivisions = subdivisions
		}

        let ref = null
        if (props.forwardedRef) {
            ref = props.forwardedRef
        } else {
            ref = state.localRef
        }

        if (ref !== state.ref) {
            diff.ref = ref
        }

		return diff
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

    getMeasureBoundary() {
        return this.state.ref.current.getBoundingClientRect()
    }

    handleStringClick(index, e) {
        const bound = this.state.ref.current.getBoundingClientRect(),
            x = e.pageX - bound.left,
            w = x / bound.width

        console.log("handleStringClick ", index, x, w)
        this.props.onStringClick(this, index, this.getMeasureBoundary(), e)
    }

    handleStringDrop(index, e) {
        this.props.onStringDrop(this, index, this.getMeasureBoundary(), e);
    }

	handleStringDragOver(index, e) {
        this.props.onStringDragOver(this, index, this.getMeasureBoundary(), e);
    }

    handleNoteClick(string, index, e) {
       // this.props.onStringClick(this, index, e);
        const bound = this.state.ref.current.getBoundingClientRect(),
            x = e.pageX - bound.left,
            w = x / bound.width

        console.log("noteClick ", string, index, x, w)
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

    nextNoteDistanceOrRemaining(string, pos, skipKeys) {
        return this.props.measure.nextNoteDistanceOrRemaining(string, pos, skipKeys)
    }

    addNote(string, note) {
        return this.props.measure.addNote(string, note)
    }

    removeNoteByIndex(string, noteIndex) {
        return this.props.measure.removeNoteByIndex(string, noteIndex)
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
          <div key={this.props.measure.key} className="measure" ref={this.state.ref}
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
                          zIndex: 40,
						  display: 'none'
                      }} />
              </div>

              
              <div className="notes" style={{ position: 'relative' }}>
			
			    {this.props.measure.strings.map((str, idx) => (
                      str.map((note, nidx) =>
                          <Note key={note.key} x={this.noteXPosition(note)} y={this.stringYOffset(idx + 1)} note={note} string={idx} dy={noteTextOffset} measure={this.props.measure}
                              d={this.noteDurationSize(note)} index={nidx} onClick={this.handleNoteClick} selected={this.isNoteSelected(nidx, idx)}
                              onDrop={this.handleStringDrop} onDragStart={this.props.onNoteDragStart} onDragEnd={this.props.onNoteDragEnd} canDrag={this.props.canDragNote}
                              onDragOver={this.handleStringDragOver}
                              layout={this.props.layout}  />
				    )
			    ))}
			
              </div>

              <Ruler y={this.rulerBottom()} d={this.props.measure.duration()} dx={beginningOffset} subdivisions={this.state.subdivisions} subdivisionSpacing={subDivSize}
                  width={this.measureWidth()} height={subDivSize} showIndicator={this.props.isPlaying} isPaused={this.props.isPaused}
                  totalTime={this.props.measure.totalTime()} measure={this.props.measure} currentTime={this.props.currentTime} />
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
        this.endAnimation = this.endAnimation.bind(this)
	}

    static getDerivedStateFromProps(props, state) {
        if (props.showIndicator && !state.isShowingIndicator) {
            return {
                startAnimation: true
            }
        }

        return null
    }

    componentWillUnmount() {
        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.cancel()
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        //console.log('componentDidUpdate', this.props.isPaused, prevProps !== undefined && !prevProps.isPaused)

        if (this.state.startAnimation) {
            const dist = this.props.subdivisionSpacing * this.props.subdivisions * this.props.d
            console.log('animate', this.props.measure.key, this.props.currentTime, this.props.totalTime, prevState)
            const animation = this.indicatorRef.current.animate([
                    // keyframes
                { transform: 'translateX(0em)'},
                { transform: 'translateX(' + dist + 'em)' },
            
                ], {
                    // timing options
                    duration: this.props.totalTime * 1000,
                    iterations: 1
                })

            animation.onfinish = this.endAnimation

            this.setState({
                isShowingIndicator: true,
                indicatorAnimation: animation,
                startAnimation: false
            })

        } else if (!this.props.showIndicator && this.state.isShowingIndicator) {
            this.setState({
                isShowingIndicator: false
            })
        }

        if (this.props.isPaused && !prevProps.isPaused) {
            console.log('pause')
            this.pauseAnimation()
        } else if (!this.props.isPaused && prevProps.isPaused) {
            console.log('play')
            this.playAnimation()
        }
    }

    pauseAnimation() {
        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.pause()
        }
    }

    playAnimation() {
        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.play()
        }
    }

    endAnimation() {
        if (this.indicatorRef.current) {
            this.indicatorRef.current.style.visibility = 'hidden'
        }

        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.cancel()
            
            this.setState({
                isShowingIndicator: false,
                indicatorAnimation: null
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
        //console.log('render')
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

                    {<line ref={this.indicatorRef} className={"ruler-tick"} style={{
                        stroke: 'blue',
                        visibility: this.state.isShowingIndicator ? 'visible' : 'hidden'
                    }}
                        x1={this.props.dx + 'em'}
                        x2={this.props.dx + 'em'}
                        y1={0.3 + 'em'}
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
        this.handleDragOver = this.handleDragOver.bind(this)
        this.handleDrop = this.handleDrop.bind(this)
    }

    handleClick(e) {
        const bound = e.target.getBoundingClientRect()
        console.log('click', e.pageX, bound.left, e.target)
        this.props.onClick(this.props.string, this.props.index, e)
    }

    handleDragStart(evt) {
        console.log('dragstart')

        this.props.onDragStart({
            measure: this.props.measure,
            string: this.props.string,
            note: this.props.note,
            noteIndex: this.props.index
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

    handleDragOver(evt) {
        console.log('handleDragOver')
        this.props.onDragOver(this.props.string, evt)
    }

    handleDrop(evt) {
        console.log('handleDrop')
        this.props.onDrop(this.props.string, evt)
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
                onDragOver={this.handleDragOver} onDrop={this.handleDrop}
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
						>{this.props.note.f}</text>
	  
					<text className="note-text clickable" 
							x={imgLeft + 'em'}
							y={imgMiddle + 'em'}
						dy={this.props.dy + 'em'} 
						textAnchor="middle"
						onClick={this.handleClick}
						>{this.props.note.f}</text>
				</svg>
            </div>
	    )
    }
}

export default MeasureDisplay
