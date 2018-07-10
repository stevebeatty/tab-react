import { Song } from 'js/mdl/Song'
import { TabWriter } from './TabWriter'

test('new should work', () => {
    var tw = new TabWriter()
})
/*
test('writeMeasure', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 4,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 0, d: 1, i: 4, p: 0 }],
                    [],
                    [{ f: 2, d: 1, i: 4, p: 1 }],
                    [{ f: 3, d: 1, i: 4, p: 2 }],
                    [],
                    [{ f: 5, d: 1, i: 4, p: 3 }]
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeMeasure(song.measures[0])
    const result = tw.output()

    console.log(result)

    expect(result).toEqual("|-0-------\n" +
                           "|---------\n" +
                           "|---2-----\n" +
                           "|-----3---\n" +
                           "|---------\n" +
                           "|-------5-")
})
/*
test('writeMeasure 4/4 time with eighth note interval', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 4,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 0, d: 1, i: 8, p: 0 }],
                    [],
                    [{ f: 12, d: 1, i: 4, p: 1 }],
                    [{ f: 3, d: 1, i: 4, p: 2 }],
                    [],
                    [{ f: 5, d: 1, i: 4, p: 3 }]
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeMeasure(song.measures[0])
    const result = tw.output()

    console.log(result)

    expect(result).toEqual(
        "|-0------------\n" +
        "|--------------\n" +
        "|----12--------\n" +
        "|--------3-----\n" +
        "|--------------\n" +
        "|-----------5--")
})
*/
/*
test('writeMeasure with 3/4 time and eighth notes', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 3,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 0, d: 1, i: 8, p: 1.5 }],
                    [{ f: 1, d: 1, i: 8, p: 2 }],
                    [{ f: 2, d: 1, i: 8, p: 1 }, { f: 2, d: 1, i: 8, p: 2.5 }],
                    [{ f: 2, d: 1, i: 8, p: 0.5 }],
                    [{ f: 0, d: 1, i: 8, p: 0 }],
                    []
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeMeasure(song.measures[0])
    const result = tw.output()

    console.log(result)

    expect(result).toEqual(
        "|-------0-----\n" +
        "|---------1---\n" +
        "|-----2-----2-\n" +
        "|---2---------\n" +
        "|-0-----------\n" +
        "|-------------")
})
*/
/*
test('writeMeasure with effect', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 4,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 0, d: 1, i: 4, p: 0, effect: 'vibrato' }],
                    [],
                    [{ f: 12, d: 1, i: 4, p: 1, effect: 'slide-down' }],
                    [{ f: 3, d: 1, i: 4, p: 2 }],
                    [],
                    [{ f: 5, d: 1, i: 4, p: 3, effect: 'slide-up'  }]
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeMeasure(song.measures[0])
    const result = tw.output()

    console.log(result)

    expect(result).toEqual(
        "|-0--------\n" +
        "|----------\n" +
        "|---12-----\n" +
        "|------3---\n" +
        "|----------\n" +
        "|--------5-")
})
*/

test('writeMeasure with effect', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 4,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 4, d: 1, i: 4, p: 3 }],
                    [{ f: 6, d: 1, i: 4, p: 0, effect: 'vibrato' }, { f: 3, d: 1, i: 4, p: 1 }],
                    [{ f: 5, d: 1, i: 4, p: 2, effect: 'slide-up' }, { f: 12, d: 1, i: 4, p: 3 }],
                    [{ f: 3, d: 1, i: 4, p: 1, effect: 'slide-down' }, { f: 5, d: 1, i: 4, p: 2}, { f: 9, d: 1, i: 4, p: 3 }],
                    [{ f: 3, d: 1, i: 4, p: 1 }],
                    []
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeMeasure(song.measures[0])
    const result = tw.output()

    console.log(result)
     
    expect(result).toEqual(
        "|-0--------\n" +
        "|----------\n" +
        "|---12-----\n" +
        "|------3---\n" +
        "|----------\n" +
        "|--------5-")
})

/*
test('writeSong', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 4,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 0, d: 1, i: 4, p: 0 }],
                    [],
                    [{ f: 2, d: 1, i: 4, p: 1 }],
                    [{ f: 3, d: 1, i: 4, p: 2 }],
                    [],
                    [{ f: 5, d: 1, i: 4, p: 3 }]
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeSong()
    const result = tw.getTab()

    console.log(result)

    expect(result).toEqual(
        "e|-0-------\n" +
        "B|---------\n" +
        "G|---2-----\n" +
        "D|-----3---\n" +
        "A|---------\n" +
        "E|-------5-")
})
*/
/*
test('writeSong multiple measures', () => {
    var tw = new TabWriter()

    const song = new Song({
        title: 'title',
        artist: 'artist',
        d: 4,
        i: 4,
        tempo: 60,
        measures: [
            {
                strings: [
                    [{ f: 0, d: 1, i: 4, p: 0 }],
                    [],
                    [{ f: 2, d: 1, i: 4, p: 1 }],
                    [{ f: 3, d: 1, i: 4, p: 2 }],
                    [],
                    [{ f: 5, d: 1, i: 4, p: 3 }]
                ]
            },
            {
                strings: [
                    [{ f: 0, d: 1, i: 4, p: 0 }],
                    [],
                    [{ f: 2, d: 1, i: 4, p: 1 }],
                    [{ f: 3, d: 1, i: 4, p: 2 }],
                    [],
                    [{ f: 5, d: 1, i: 4, p: 3 }]
                ]
            }
        ]
    })

    tw.setSong(song)
    tw.writeSong()
    const result = tw.getTab()

    console.log(result)

    expect(result).toEqual(
        "e|-0-------|-0-------\n" +
        "B|---------|---------\n" +
        "G|---2-----|---2-----\n" +
        "D|-----3---|-----3---\n" +
        "A|---------|---------\n" +
        "E|-------5-|-------5-")
})
*/

