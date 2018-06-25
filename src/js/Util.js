function rangeArray(start, end, step=1) {
    let a = []
    while (start < end) {
        a.push(start)
        start += step
    }
    return a
}

function* range(start, end, step = 1) {
    while (start < end) {
        yield start
        start += step
    }
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


export { rangeArray, IdGenerator, range }