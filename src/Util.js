function rangeArray(start, end, step) {
    let a = []
    while (start < end) {
        a.push(start)
        start += step
    }
    return a
}

export { rangeArray }