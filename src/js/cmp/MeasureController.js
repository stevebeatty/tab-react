import React, { Component } from 'react'
import MeasureDisplay from './MeasureDisplay'
import { Measure } from 'js/mdl/Measure'

//
// <MeasureController song={} selectedMeasure={} selecteNote={} onNoteSelect={} onMeasureSelect={} onSongUpdate={} 
//  dragging={} canDragNote={} measureRef={} />
//

/**
 * Renders all measures for song and handles events from child components
 */
class MeasureController extends Component {

    constructor(props) {
        super(props);

        this.handleStringClick = this.handleStringClick.bind(this);
        this.handleChangeSelectedNoteString = this.handleChangeSelectedNoteString.bind(this);
        this.handleDragStart = this.handleDragStart.bind(this);
        this.handleDragEnd = this.handleDragEnd.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleStringDrop = this.handleStringDrop.bind(this);
        this.handleRulerClick = this.handleRulerClick.bind(this)
    }

    

    // Event handlers

    handleDragOver(measure, string, bound, evt) {
        evt.preventDefault()

        const stringDelta = string - this.props.dragging.dragOrigin.string
        const fits = this.checkNoteListFit(this.props.dragging, measure, stringDelta, bound, evt)

        if (fits.status) {
            evt.dataTransfer.dropEffect = 'move'
            this.updateSequenceFromListFit(fits)
      
        } else {
            evt.dataTransfer.dropEffect = 'none'
        }

    }

    handleStringClick(measure, string, bound, e) {
        if (!this.props.canClickString) return

        const stringDist = this.stringEventDistance(measure, string, bound, e)

        if (stringDist.d !== 0) {
            // doing calcs in larger values and then simplifying to avoid fractions
            const dur = Math.min(stringDist.d, 1) * measure.state.subdivisions,
                int = measure.props.measure.interval() * measure.state.subdivisions

            console.log('dur ', dur, ' dist ', stringDist.d, measure.state.subdivisions * Math.min(stringDist.d, 1));

            const note = {
                p: stringDist.p, d: dur, f: 0, i: int
            }
            Measure.simplifyNoteTiming(note);

            console.log(' str ', int, note)

            const noteIndex = measure.addNote(string, note)

            this.props.onSongUpdate()
            this.props.onNoteSelect({ measure: measure.props.measure, string, note, noteIndex })
        }

    }

    handleStringDrop(measure, string, bound, evt) {

        const stringDelta = string - this.props.dragging.dragOrigin.string,
            fits = this.checkNoteListFit(this.props.dragging, measure, stringDelta, bound, evt)

        console.log('drop', this.props.dragging, fits)

        if (fits.status) {
            const updated = this.updateSequenceFromListFit(fits, stringDelta)

            for (const fit of fits.result) {
                for (const o of fit.original) {
                    o.measure.removeNoteByKey(o.note.key, o.string)
                }
            }

            let selection = []

            for (const upd of updated) {
                for (const u of upd.updated) {
                    const note = Object.assign({}, u)

                    delete note.measure
                    delete note.note

                    const noteIndex = u.measure.addNote(upd.string, note)
                    selection.push({ measure: u.measure, string: upd.string, note, noteIndex })
                }
            }
            console.log(selection)
            this.props.onSongUpdate()
            this.props.onNoteSelect(selection)
        }

        this.props.onDragging({})
    }

    handleDragStart(info, evt) {
        this.props.onDragging(info)
    }

    handleDragEnd(evt) {
        this.props.onDragging({})
    }


    handleChangeSelectedNoteString(string) {
        const measure = this.props.selectedNote.measureObj,
            removed = measure.removeNoteByIndex(this.props.selectedNote.string, this.props.selectedNote.note),
            note = removed[0],
            noteIndex = measure.addNote(string, note)

        this.props.onSongUpdate()
        this.props.onNoteSelect({ measure: measure.props.measure, string, note, noteIndex })
    }

    handleRulerClick(measureCmp, pos) {
        const measure = measureCmp.props.measure,
            notes = measure.notesAtPosition(pos),
            selection = []

        for (const [string, noteObj] of notes) {
            selection.push({ measure, string, note: noteObj.note, noteIndex: noteObj.noteIndex })
        }

        this.props.onNoteSelect(selection)
    }

    // Size methods

    stringEventDistance(measure, stringIndex, bound, e, noteKey) {
        const x = e.pageX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistanceOrRemaining(stringIndex, pos, noteKey);

        return {
            p: pos,
            d: dist
        }
    }

    checkNoteFit(drag, endPoint, stringIndex, processed, skipKeys) {
        const measures = this.props.song.measures,
            measureIndex = endPoint.measureIndex

        if (measureIndex < 0 || measureIndex >= this.props.song.measures.length ||
            stringIndex < 0 || stringIndex >= measures[measureIndex].strings.length) {
            return { status: false }
        }

        const measure = measures[measureIndex],
            noteSeq = this.props.song.getNoteSequence(drag.note.key, drag.measure.key),
            noteKey = noteSeq[0].note.key

        if (processed.has(noteKey)) {
            return { status: true, duplicate: noteKey }
        }

        processed.add(noteKey)

        const fits = this.props.song.sequenceSpan(noteSeq, measure.key, stringIndex, endPoint.p, skipKeys)
        return fits
    }

    checkNoteListFit(drag, measure, stringDelta, bound, evt) {
        let fitResult = [],
            fits = true,
            value = Array.isArray(drag.value) ? drag.value : [drag.value],
            origin = drag.dragOrigin,
            dragNoteKeys = value.map(v => { return v.note.key })

        const stringDist = this.stringEventDistance(measure, origin.string + stringDelta, bound, evt, origin.note.key),
            processed = new Set(),
            distResult = this.props.song.findDistance(origin.measure.key, origin.note.p, measure.props.measure.key, stringDist.p)

        for (let i = 0; i < value.length; i++) {
            let d = value[i],
                string = d.string + stringDelta,
                endPoint = this.props.song.movePositionList(d.measure, d.note.p, distResult),
                fit = this.checkNoteFit(d, endPoint, string, processed, dragNoteKeys)

            if (!fit.duplicate) {
                fits = fits && fit.status
                fit.string = string
                fitResult.push(fit)
            }
        }

        return {
            status: fits && fitResult.length > 0,
            result: fitResult
        }
    }

    updateSequenceFromListFit(fits) {
        let result = []

        for (const fit of fits.result) {
            let upd = this.props.song.updateSequence(fit)

            result.push({ updated: upd, string: fit.string })
        }

        return result
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
                onRulerClick={this.handleRulerClick}
                isPlaying={isPlaying} isPaused={this.props.isPaused}
                {...optionalAtts}
            />)
    }

    measureNeedsRef(measure) {
        const hasSelectedNote = this.props.selection.type === 'note';
        const hasSelectedMeasure = this.props.selection.type === 'measure',
            value = Array.isArray(this.props.selection.value) ? this.props.selection.value[0] : this.props.selection.value

        if (hasSelectedNote) {
            return measure.key === value.measure.key
        } else if (hasSelectedMeasure) {
            return measure.key === value.measure.key
        } else {
            return false
        }
    }

    render() {

        return (
            <div className={'measures ' + (this.props.canDragNote ? 'drag-enabled click-enabled' : 'drag-disabled click-disabled')}>
                {this.props.song.measures.map((measure, idx) => this.createMeasureTag(measure))}
            </div>
        )
    }
}
export { MeasureController as default };
