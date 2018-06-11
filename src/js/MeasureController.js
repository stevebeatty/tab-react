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

    stringEventDistance(measure, stringIndex, bound, e, noteIndex) {
        const x = e.pageX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistanceOrRemaining(stringIndex, pos, noteIndex);

         console.log('stringEventDistance ', stringIndex, pos, dist, measure.props.measure.key);

        return {
            p: pos,
            d: dist
        }
    }

    handleStringClick(measure, stringIndex, bound, e) {
        if (!this.props.canClickString) return

        const stringDist = this.stringEventDistance(measure, stringIndex, bound, e)

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

    handleStringDrop(measure, stringIndex, bound, e) {
        const drag = this.props.dragging,
            noteIndex = stringIndex === drag.string ? drag.note : undefined,
            stringDist = this.stringEventDistance(measure, stringIndex, bound, e, noteIndex)

        console.log('handleStringDrop string ', stringIndex, ' dist ', stringDist.d)

        if (stringDist.d !== 0) {
            const drag = this.props.dragging,
                m = this.props.song.measureWithKey(drag.measure),
                note = m.noteWithIndex(drag.string, drag.note),
                d = note.d * m.interval() / note.i

            console.log('pos ', stringDist.p, ' end ', note.d + stringDist.p, 'dist & d ', stringDist.d, note.d)

            if (stringDist.d < d) {
                console.log('cant fit')
                return
            } else {
                m.removeNote(drag.string, drag.note)

                note.p = stringDist.p
                const newIdx = measure.addNote(stringIndex, note)

                this.props.onSongUpdate()
                this.props.onNoteSelect(measure, stringIndex, newIdx)
            }
        }
    }

    handleDragOver(measure, stringIndex, bound, evt) {
        evt.preventDefault()

        const drag = this.props.dragging,
            noteIndex = stringIndex === drag.string ? drag.note : undefined,
            stringDist = this.stringEventDistance(measure, stringIndex, bound, evt, noteIndex)
        console.log('dragover', stringIndex, stringDist)

        if (stringDist.d !== 0) {

            const m = this.props.song.measureWithKey(drag.measure),
                note = m.noteWithIndex(drag.string, drag.note),
                d = note.d * m.interval() / note.i

            console.log('pos', stringDist.p, 'end', note.d + stringDist.p, 'dist & d', stringDist.d, note.d, note.d*m.interval()/note.i )

            if (stringDist.d < d) {
                // console.log('cant fit')
                evt.dataTransfer.dropEffect = 'none'
                return
            }

            evt.dataTransfer.dropEffect = 'move'
            return
        }

        evt.dataTransfer.dropEffect = 'none'
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
        const optionalAtts = {},
            isSelected = this.props.selection.type === 'measure' && measure.key === this.props.selection.value.measure.key,
            isPlaying = this.props.playingMeasure && measure.key === this.props.playingMeasure.key

        if (this.measureNeedsRef(measure)) {
            optionalAtts.forwardedRef = this.props.measureRef
        }

        if (isPlaying) {
            optionalAtts.currentTime = this.props.playingMeasureTime
        }


        return (

            <MeasureDisplay
                key={measure.key} measure={measure} layout={this.props.layout}
                selected={isSelected} selection={this.props.selection} onMeasureSelect={this.props.onMeasureSelect}
                onStringClick={this.handleStringClick} onStringDragOver={this.handleDragOver} onStringDrop={this.handleStringDrop}
                onNoteClick={this.props.onNoteSelect} 
                onNoteDragStart={this.handleDragStart} onNoteDragEnd={this.handleDragEnd} canDragNote={this.props.canDragNote}
                isPlaying={isPlaying} isPaused={this.props.isPaused}
                {...optionalAtts}
            />)
    }

    measureNeedsRef(measure) {
        const hasSelectedNote = this.props.selection.type === 'note';
        const hasSelectedMeasure = this.props.selection.type === 'measure';

        if (hasSelectedNote) {
            return measure.key === this.props.selection.value.measure;
        } else if (hasSelectedMeasure) {
            return measure.key === this.props.selection.value.measure.key;
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
