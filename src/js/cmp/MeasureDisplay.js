import React, { Component } from 'react';
import { String } from './String'
import { Ruler } from './Ruler'
import { Note } from './Note'


export default class MeasureDisplay extends Component {
	constructor(props) {
		super(props);
        
        this.state = {
            localRef: React.createRef()
		};
		
        this.handleClick = this.handleClick.bind(this);
        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleNoteClick = this.handleNoteClick.bind(this);
        this.handleNoteDrag = this.handleNoteDrag.bind(this);
        this.handleStringDrop = this.handleStringDrop.bind(this);
        this.handleStringDragOver = this.handleStringDragOver.bind(this);
        this.handleRulerClick = this.handleRulerClick.bind(this)
        this.handleSelectionDragStart = this.handleSelectionDragStart.bind(this)
        this.handleDragStart = this.handleDragStart.bind(this)

        this.selectionRef = React.createRef()
	}
	
	static getDerivedStateFromProps(props, state) {
		const intervals = props.measure.distinctIntervals(),
		     maxI = Math.max(...intervals),
             subdivisions = maxI / props.measure.interval()

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

    handleNoteClick(string, noteIndex, note, e) {
        const bound = this.state.ref.current.getBoundingClientRect(),
            x = e.pageX - bound.left,
            w = x / bound.width

        console.log("noteClick ", string, noteIndex, x, w)
        this.props.onNoteClick({ measure: this.props.measure, string, note, noteIndex });
    }

    handleNoteDrag(e) {
        const bound = e.target.getBoundingClientRect(),
            x = e.clientX - bound.left,
            w = x / bound.width,
            pos = this.closestPosition(w)

        console.log('pos ', pos, e.clientX, e.clientY, e.target.getBoundingClientRect())
    }

    isObjectSameNote(value, string, noteIndex) {
        return value.noteIndex === noteIndex &&
            value.string === string &&
            value.measure.key === this.props.measure.key;
    }

    isNoteSelected(noteIndex, stringIndex) {
        if (this.props.selection &&
            this.props.selection.type === 'note') {

            if (Array.isArray(this.props.selection.value)) {
                return this.props.selection.value.some(v => {
                    return this.isObjectSameNote(v, stringIndex, noteIndex)
                })
            } else {
                return this.isObjectSameNote(this.props.selection.value, stringIndex, noteIndex)
            }

        }

        return false
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

    handleDragStart(info, evt, isSelected) {
        if (isSelected) {
            const el = this.selectionRef.current,
                bound = el.getBoundingClientRect(),
                x = window.devicePixelRatio * (evt.clientX - bound.left),
                y = window.devicePixelRatio * (evt.clientY - bound.top)

            evt.dataTransfer.setDragImage(el, x, y)
            this.props.onNoteDragStart({ value: this.props.selection.value, dragOrigin: info }, evt)
        } else {
            this.props.onNoteDragStart({ value: info, dragOrigin: info }, evt)
        }
    }

    handleRulerClick(pos) {
        this.props.onRulerClick(this, pos)
    }

    generateNoteCmp(note, noteIndex, string, isSelected) {
        return <Note key={note.key} x={this.noteXPosition(note)} y={this.stringYOffset(string + 1)} note={note} string={string} dy={this.props.layout.noteTextOffset()} measure={this.props.measure}
            d={this.noteDurationSize(note)} index={noteIndex} onClick={this.handleNoteClick} selected={isSelected}
            onDrop={this.handleStringDrop} onDragStart={this.handleDragStart} onDragEnd={this.props.onNoteDragEnd} canDrag={this.props.canDragNote}
            onDragOver={this.handleStringDragOver}
            layout={this.props.layout} />
    }

    handleSelectionDragStart(evt) {
        evt.dataTransfer.setDragImage(this.selectionRef.current, 0, 0)
    }

    render() {
        const noteTextOffset = this.props.layout.noteTextOffset();
        const beginningOffset = this.props.layout.measureSideOffset();
        const subDivSize = this.props.layout.subdivisionOffset();
        const clickBoxHeight = this.props.layout.stringClickBoxHeight(),
            bottomStringHeight = this.stringYOffset(this.props.measure.strings.length) - this.stringYOffset(1)

        const refAtt = {};
        if (this.props.forwardedRef) {
            refAtt.ref = this.props.forwardedRef;
        } else {
        }

        const selectedNotes = [], unselectedNotes = []

        this.props.measure.strings.forEach((str, idx) => {
            str.forEach((note, nidx) => {
                const isSelected = this.isNoteSelected(nidx, idx),
                    noteList = (isSelected ? selectedNotes : unselectedNotes)

                noteList.push([note, nidx, idx, isSelected])
            })
        })

      return (
          <div key={this.props.measure.key} className="measure" ref={this.state.ref}
               style={{ width: this.measureWidth() + 'em', height: this.measureHeight() + 'em' }}>

		      <div className="strings">
                      {this.props.measure.strings.map((str, idx) =>
                          <String key={idx} index={idx} offset={this.stringYOffset(idx + 1)} boxHeight={clickBoxHeight} onClick={this.handleStringClick}
                              locked={!this.props.canDragNote} onDrop={this.handleStringDrop} onDragOver={this.handleStringDragOver} />
			    )}
		      </div>
		  
		      <div className="etc">
                  <div className="measure-begin" x1="1" x2="1" style={{
                      width: '1px', height: bottomStringHeight + 'em', backgroundColor: 'black',
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
                  {unselectedNotes.map(v => this.generateNoteCmp(...v))}
              </div>

              <div ref={this.selectionRef} style={{ position: 'relative', pointerEvents: 'none', zIndex: '21', width: this.measureWidth() + 'em', height: this.stringYOffset(this.props.measure.strings.length) + 0.8 + 'em' }}>
                  {selectedNotes.map(v => this.generateNoteCmp(...v))}
              </div>

              <Ruler y={this.rulerBottom()} d={this.props.measure.duration()} dx={beginningOffset} subdivisions={this.state.subdivisions} subdivisionSpacing={subDivSize}
                  width={this.measureWidth()} height={subDivSize} showIndicator={this.props.isPlaying} isPaused={this.props.isPaused}
                  totalTime={this.props.measure.totalTime()} measure={this.props.measure} currentTime={this.props.currentTime} onRulerClick={this.handleRulerClick} />
	      </div>
	  )
  }
}
