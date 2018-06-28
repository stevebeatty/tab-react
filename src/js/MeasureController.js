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
        this.handleRulerClick = this.handleRulerClick.bind(this)
    }

    stringEventDistance(measure, stringIndex, bound, e, noteKey) {
        const x = e.pageX - bound.left,
            w = x / bound.width,
            pos = measure.closestPosition(w),
            dist = measure.nextNoteDistanceOrRemaining(stringIndex, pos, noteKey);

         //console.log('stringEventDistance ', stringIndex, pos, dist, measure.props.measure.key);

        return {
            p: pos,
            d: dist
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
            measure.props.measure.simplifyNoteTiming(note);

            console.log(' str ', int, note)

            const noteIndex = measure.addNote(string, note)

            this.props.onSongUpdate()
            this.props.onNoteSelect({ measure: measure.props.measure, string, note, noteIndex })
        }

    }

    handleStringDrop(measure, string, bound, evt) {
/*
        if (!this.props.dragging.note) {
            console.log('no note, but dropping')
            return
        }
        *//*
        const drag = this.props.dragging,
            noteKey = drag.note.key,
            stringDist = this.stringEventDistance(measure, string, bound, evt, noteKey),
            noteSeq = this.props.song.getNoteSequence(noteKey, drag.measure.key),
            fits = this.props.song.sequenceSpan(noteSeq, measure.props.measure.key, string, stringDist.p)
            */
        const stringDelta = string - this.props.dragging.originalString,
            fits = this.checkNoteListFit(this.props.dragging, measure, stringDelta, bound, evt)
            
        console.log('drop', this.props.dragging, fits)

        if (fits.status) {
            const updated = this.updateSequenceFromListFit(fits, stringDelta)
            //console.log('updated', updated)

            for (const fit of fits.result) {
                for (const o of fit.original) {
                    o.measure.removeNoteByKey(o.note.key, o.string)
                }
            }

            let selection = []

            for (const upd of updated) {
                for (const u of upd.updated) {
                    const note = Object.assign({}, u, {
                        measure: undefined, note: undefined
                    })
                    const noteIndex = u.measure.addNote(upd.string, note)
                    selection.push({ measure: u.measure, string: upd.string, note, noteIndex })
                }
            }
            console.log(selection)
            this.props.onSongUpdate()
            this.props.onNoteSelect(selection)
        }

        /*
        if (fits.status) {
            const updated = this.props.song.updateSequence(fits)
            console.log('updated', updated)

            noteSeq.forEach(n => {
                console.log('seq', n)
                n.measure.removeNoteByKey(n.note.key, n.string)
            })

            let seqStart = undefined

            updated.forEach(u => {
                const note = Object.assign({}, u, {
                    measure: undefined, note: undefined
                })
                const noteIndex = u.measure.addNote(string, note)
                if (seqStart === undefined) {
                    seqStart = { note, noteIndex }
                }
            })

            this.props.onSongUpdate()
            this.props.onNoteSelect({ measure: measure.props.measure, string, note: seqStart.note, noteIndex: seqStart.noteIndex })
        } else {
        }
        */
        this.props.onDragging({})
    }

    checkNoteFit(drag, measure, stringIndex, distance, processed) {
        console.log('checkNoteFit', stringIndex, distance)
        if (stringIndex < 0 || stringIndex >= measure.props.measure.strings.length) {
            return { status: false }
        }

        const noteSeq = this.props.song.getNoteSequence(drag.note.key, drag.measure.key),
			noteKey = noteSeq[0].note.key

		if (processed.has(noteKey)) {
			return { status: true, duplicate: noteKey }
		}
		
		processed.add(noteKey)

        const fits = this.props.song.sequenceSpan(noteSeq, measure.props.measure.key, stringIndex, distance)
        return fits
    }

    checkNoteListFit(drag, measure, stringDelta, bound, evt) {
        console.log('stringDelta', stringDelta)
        let fitResult = [],
            fits = true,
            value = Array.isArray(drag.value) ? drag.value : [drag.value],
            first = value[0]

        const stringDist = this.stringEventDistance(measure, first.string + stringDelta, bound, evt, first.note.key),
            posDelta = stringDist.p - first.note.p,
			processed = new Set()

        for (let i = 0; i < value.length; i++) {
            let d = value[i],
                string = d.string + stringDelta,
                fit = this.checkNoteFit(d, measure, string, d.note.p + posDelta, processed)

            console.log('d', d, fit)
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
                  console.log('updated', upd)
        }

        return result
    }

    handleDragOver(measure, string, bound, evt) {
        evt.preventDefault()

        //console.log('%', this.props.dragging.note, measure.props.measure.key)
        /*if (!this.props.dragging.note) {
            console.log('no note, but dragging')
            return
        }*/

        //console.log(this.props.dragging.note)

    /*    const drag = this.props.dragging,
            noteKey = drag.note.key,
            stringDist = this.stringEventDistance(measure, stringIndex, bound, evt, noteKey),
            noteSeq = this.props.song.getNoteSequence(noteKey, drag.measure.key),
            fits = this.props.song.sequenceSpan(noteSeq, measure.props.measure.key, stringIndex, stringDist.p)
            */
        const stringDelta = string - this.props.dragging.originalString
        console.log(this.props.dragging)
        const fits = this.checkNoteListFit(this.props.dragging, measure, stringDelta, bound, evt)

       // console.log('dragover', fits, noteSeq)
        console.log('fits', fits)

        if (fits.status) {
            evt.dataTransfer.dropEffect = 'move'
            this.updateSequenceFromListFit(fits)
      
        } else {
            evt.dataTransfer.dropEffect = 'none'
        }

    }



    handleDragStart(info, evt) {
        //console.log('dragstart')
        this.props.onDragging(info)
    }

    handleDragEnd(evt) {
        //console.log('dragend')
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
        console.log('ruler click', selection, notes)
        this.props.onNoteSelect(selection)
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
            <React.Fragment>
                {this.props.song.measures.map((measure, idx) => this.createMeasureTag(measure))}
            </React.Fragment>
        )
    }
}
export { MeasureController as default };
