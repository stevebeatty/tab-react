import React, { Component } from 'react'
import MeasureDisplay from './MeasureDisplay'

//
// <MeasureController song={} selectedMeasure={} selecteNote={} onNoteSelect={} onMeasureSelect={} onSongUpdate={} 
//  dragging={} canDragNote={} measureRef={} />
//

class MeasureController extends Component {

    constructor(props) {
        super(props);

        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleChangeSelectedNoteString = this.handleChangeSelectedNoteString.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleStringDrop = this.handleStringDrop.bind(this);
    }

    stringEventDistance(measure, stringIndex, e) {
        const bound = e.target.getBoundingClientRect(),
            x = e.pageX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistanceOrRemaining(stringIndex, pos);

        // console.log('stringEventDistance ', stringIndex, x, w, pos, dist);

        return {
            p: pos,
            d: dist
        }
    }

    handleStringClick(measure, stringIndex, e) {
        if (this.state.locked) return

        const stringDist = this.stringEventDistance(measure, stringIndex, e)

        if (stringDist.d !== 0) {
            // doing calcs in larger values and then simplifying to avoid fractions
            const dur = Math.min(stringDist.d, 1) * measure.state.subdivisions,
                int = measure.props.measure.interval() * measure.state.subdivisions

            console.log('dur ', dur, ' dist ', stringDist.d, measure.state.subdivisions * Math.min(stringDist.d, 1));

            const note = {
                p: stringDist.p, d: dur, f: 0, i: int
            }
            this.simplifyNoteTiming(note);

            console.log(' str ', int, note)

            const idx = measure.addNote(stringIndex, note)

            this.props.onSongUpdate()
            this.props.onNoteSelect(measure, stringIndex, idx)
        }

    }

    handleStringDrop(measure, stringIndex, e) {
        const stringDist = this.stringEventDistance(measure, stringIndex, e)

        console.log('handleStringDrop string ', stringIndex, ' dist ', stringDist.d)

        if (stringDist.d !== 0) {
            const drag = this.props.dragging,
                m = this.props.song.measureWithKey(drag.measure),
                note = m.noteWithIndex(drag.string, drag.note)

            console.log('pos ', stringDist.p, ' end ', note.d + stringDist.p, 'dist & d ', stringDist.d, note.d)

            if (stringDist.d < note.d) {
                console.log('cant fit')
                return
            } else {
                m.removeNote(drag.string, drag.note)

                note.p = stringDist.p
                measure.addNote(stringIndex, note)
            }
        }
    }

    handleDragOver(measure, stringIndex, evt) {
        //console.log('dragover', measure, evt)
        evt.preventDefault()

        const stringDist = this.stringEventDistance(measure, stringIndex, evt)

        if (stringDist.d !== 0) {

            const drag = this.props.dragging,
                m = this.props.song.measureWithKey(drag.measure),
                note = m.noteWithIndex(drag.string, drag.note)

            //console.log('pos ', stringDist.p, ' end ', note.d + stringDist.p, 'dist & d ', stringDist.d, note.d)

            if (stringDist.d < note.d) {
                // console.log('cant fit')
                evt.dataTransfer.dropEffect = 'none'
                return
            }
        }

        evt.dataTransfer.dropEffect = 'move'
    }

    handleDragStart(info, evt) {
        console.log('dragstart')
        this.props.onDragging(info)
    }

    handleDragEnd(evt) {
        console.log('dragend')
        this.props.onDragging({})
    }


    handleChangeSelectedNoteString(string) {
        const measure = this.props.selectedNote.measureObj,
            removed = measure.removeNote(this.props.selectedNote.string, this.props.selectedNote.note),
            note = removed[0],
            idx = measure.addNote(string, note)

        this.props.onSongUpdate()
        this.props.onNoteSelect(measure, string, idx)
    }

    simplifyNoteTiming(note) {
        while (note.d % 2 === 0 && note.i % 2 === 0) {
            note.d /= 2
            note.i /= 2
        }
    }

    createMeasureTag(measure) {
        const optionalAtts = {}

        if (this.measureNeedsRef(measure)) {
            optionalAtts.forwardedRef = this.props.measureRef
        }


        return (

            <MeasureDisplay
                key={measure.key} measure={measure} layout={this.props.layout}
                selected={measure.key === this.props.selectedMeasure.key} onMeasureSelect={this.props.onMeasureSelect}
                onStringClick={this.handleStringClick} onStringDragOver={this.handleDragOver} onStringDrop={this.handleStringDrop}
                onNoteClick={this.props.onNoteSelect} selectedNote={this.props.selectedNote}
                onNoteDragStart={this.handleDragStart} onNoteDragEnd={this.handleDragEnd} canDragNote={this.props.canDragNote}
                {...optionalAtts}
            />)
    }

    measureNeedsRef(measure) {
        const hasSelectedNote = this.props.selectedNote.note !== undefined;
        const hasSelectedMeasure = this.props.selectedMeasure.key !== undefined;

        if (hasSelectedNote) {
            return measure.key === this.props.selectedNote.measure;
        } else if (hasSelectedMeasure) {
            return measure.key === this.props.selectedMeasure.key;
        } else {
            return false;
        }
    }

    render() {
        return (
            <React.Fragment>
                {this.props.song.measures.map((measure, idx) => this.createMeasureTag(measure))}
            </React.Fragment>
        )
    }
}
export { MeasureController as default };
