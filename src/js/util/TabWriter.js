import { Song } from 'js/mdl/Song'
import { Measure } from 'js/mdl/Measure'

/*
 * e|-f-
 * ^^^^^
 * |||||
 * ||||There must be an empty space after a fret to break up the notes
 * |||Fret - may take two digits and other strings will have to account for
 * |||the extra space 
 * ||String Line (first always empty)
 * |Measure line
 * String label
 */
export class TabWriter {

    setSong(song) {
        this.song = song
    }

    writeMeasure(measure) {
        const intervals = measure.distinctIntervals(),
            maxI = Math.max(...intervals),
            binSize = measure.duration() / maxI

    }

    write() {

    }
}