const MEASURE_LINE = '|'
const STRING_LINE ='-'


export class StringWriter {

    constructor(cfg) {
        this.stringLabel = cfg.stringLabel
        this.buffer = new Array()
    }

    writeStringLabel() {
        this.buffer.push(this.stringLabel)
    }

    writeMeasureLine() {
        this.buffer.push(MEASURE_LINE)
    }

    writeStringLine(count = 1) {
        while (count > 0) {
            this.buffer.push(STRING_LINE)
            count--
        }
    }

    writePadded(value, maxSize, padString) {
        const padded = (value + '').padStart(maxSize, padString)
        //console.log('padded', padded, maxSize)
        this.buffer.push(padded)
    }

    output() {
        return this.buffer.join('')
    }

    clear() {
        this.buffer = new Array()
    }
}