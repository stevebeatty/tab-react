function rangeArray(start, end, step) {
    let a = []
    while (start < end) {
        a.push(start)
        start += step
    }
    return a
}

class IdGenerator {
    constructor(start = 1) {
        this.index = start
    }

    next() {
        return this.index++
    }

    accommodateIndex(idx) {
        if (idx >= this.index) {
            this.index = idx + 1
        }
    }

    nextOrValue(value) {
        if (value === undefined || value === null) {
            return this.next()
        } else {
            this.accommodateIndex(value)
            return value
        }
    }
}


export { rangeArray, IdGenerator }