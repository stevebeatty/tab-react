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

    writeStringLine() {
        this.buffer.push(STRING_LINE)
    }



    output() {
        return this.buffer.join()
    }
}