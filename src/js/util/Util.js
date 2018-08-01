/**
 * Converts a iterator or generator to an array by traversing all entries in the iterator
 * 
 * @param {any} iterator
 */
export function iteratorToArray(iterator) {
    const arr = []
    for (let i of iterator) {
        arr.push(i)
    }
    return arr
}

/**
 * A generator function that produces a range of numbers between start and end
 * 
 * @param {Number} start
 * @param {Number} end
 * @param {Number} step
 */
export function* range(start, end, step = 1) {
    while (start < end) {
        yield start
        start += step
    }
}

/**
 * A class that produces a sequence of id numbers
*/
export class IdGenerator {
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
