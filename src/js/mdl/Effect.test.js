import { Effect, NoEffect, BaseSlideEffect, VibratoEffect, BasePullEffect, PreBendEffect, HarmonicEffect } from './Effect'

describe('Effect test', () => {
    var baseEffectTest, baseEffectOther, noEffect, slideEffect, vibratoEffect, pullEffect, preBendEffect, harmonicEffect
    var plainPart1, plainPart2, slidePart, vibratoPart, pullPart, preBendPart, harmonicPart

    beforeEach(() => {
        baseEffectTest = new Effect('test')
        baseEffectOther = new Effect('other')
        noEffect = new NoEffect()
        slideEffect = new BaseSlideEffect('slide')
        vibratoEffect = new VibratoEffect()
        pullEffect = new BasePullEffect('pull-off')
        preBendEffect = new PreBendEffect()
        harmonicEffect = new HarmonicEffect()

        plainPart1 = {
            f: 1,
            start: 0,
            stop: 1
        }

        plainPart2 = {
            f: 2,
            start: 1,
            stop: 2
        }

        slidePart = {
            f: 3,
            effects: [{ effect: 'slide' }]
        }

        vibratoPart = {
            f: 4,
            effects: [{ effect: 'vibrato' }]
        }

        pullPart = {
            f: 5,
            effects: [{ effect: 'pull-off' }]
        }

        preBendPart = {
            f: 6,
            effects: [{ effect: 'pre-bend' }]
        }

        harmonicPart = {
            f: 12,
            effects: [{ effect: 'harmonic' }]
        }
    })

    

    test('name property', () => {
        expect(baseEffectTest.name).toEqual('test')
        expect(baseEffectOther.name).toEqual('other')
    })

    test('canCombine', () => {
        expect(baseEffectTest.canCombine(baseEffectTest)).toBeTruthy()
        expect(baseEffectOther.canCombine(baseEffectOther)).toBeTruthy()
        expect(baseEffectTest.canCombine(baseEffectOther)).toBeFalsy()
        expect(baseEffectOther.canCombine(baseEffectTest)).toBeFalsy()
    })

    test('effectIn', () => {
        expect(baseEffectTest.effectObjIn(undefined)).toBeFalsy()
        expect(baseEffectTest.effectObjIn([])).toBeFalsy()
        expect(baseEffectTest.effectObjIn([{ effect: 'blah' }])).toBeFalsy()
        expect(baseEffectTest.effectObjIn([{effect: 'test' }])).toBeTruthy()
    })

    test('canApplyEffect', () => {
        expect(baseEffectTest.canApplyEffect(undefined, undefined)).toBeFalsy()
        expect(baseEffectTest.canApplyEffect(plainPart1, undefined)).toBeFalsy()
        expect(baseEffectTest.canApplyEffect(undefined, plainPart2)).toBeFalsy()

        
    })

    describe('No Effect tests', () => {

        test('canApplyEffect', () => {
            expect(noEffect.canApplyEffect(undefined, undefined)).toBeFalsy()
            expect(noEffect.canApplyEffect(plainPart1, undefined)).toBeFalsy()
            expect(noEffect.canApplyEffect(undefined, plainPart2)).toBeFalsy()
            expect(noEffect.canApplyEffect(plainPart1, plainPart1)).toBeTruthy()
            expect(noEffect.canApplyEffect(plainPart2, plainPart2)).toBeTruthy()
        })

        test('applyEffect', () => {
            expect(noEffect.applyEffect(plainPart1, plainPart2)).toBeTruthy()
        })

    })

    describe('Base Slide Effect tests', () => {

        test('canApplyEffect', () => {
            expect(slideEffect.canApplyEffect(undefined, undefined)).toBeFalsy()
            expect(slideEffect.canApplyEffect(plainPart1, undefined)).toBeFalsy()
            expect(slideEffect.canApplyEffect(undefined, slidePart)).toBeFalsy()
            expect(slideEffect.canApplyEffect(plainPart1, plainPart1)).toBeFalsy()
            expect(slideEffect.canApplyEffect(slidePart, slidePart)).toBeTruthy()
        })

        test('applyEffect', () => {
            const last = {
                f: 3,
                start: 0,
                stop: 1,
                effects: [{ effect: 'slide' }]
                },
            curr = {
                f: 3,
                start: 1,
                stop: 2
            }

            expect(slideEffect.effectObjIn(last.effects)).toBeTruthy()
            expect(slideEffect.applyEffect(last, curr)).toBeTruthy()
            expect(last.stop).toEqual(2)
        })

    })

    describe('Vibrato Effect tests', () => {

        test('canApplyEffect', () => {
            expect(vibratoEffect.canApplyEffect(undefined, undefined)).toBeFalsy()
            expect(vibratoEffect.canApplyEffect(plainPart1, undefined)).toBeFalsy()
            expect(vibratoEffect.canApplyEffect(undefined, vibratoPart)).toBeTruthy()
            expect(vibratoEffect.canApplyEffect(vibratoPart, plainPart1)).toBeFalsy()
            expect(vibratoEffect.canApplyEffect(slidePart, vibratoPart)).toBeTruthy()
        })

        test('applyEffect', () => {
            const last = {
                f: 3,
                start: 0,
                stop: 1,
                effects: [{ effect: 'vibrato' }]
            },
            curr = {
                f: 3,
                start: 1,
                stop: 2,
                effects: [{ effect: 'vibrato' }]
            }

            expect(vibratoEffect.effectObjIn(last.effects)).toBeTruthy()
            expect(vibratoEffect.applyEffect(last, curr)).toBeFalsy()
            expect(last.stop).toEqual(1)
        })

    })


    describe('PullOff Effect tests', () => {

        test('canApplyEffect', () => {
            expect(pullEffect.canApplyEffect(undefined, undefined)).toBeFalsy()
            expect(pullEffect.canApplyEffect(plainPart1, undefined)).toBeFalsy()
            expect(pullEffect.canApplyEffect(undefined, pullPart)).toBeFalsy()
            expect(pullEffect.canApplyEffect(pullPart, plainPart1)).toBeTruthy()
            expect(pullEffect.canApplyEffect(slidePart, pullPart)).toBeFalsy()
        })

        test('applyEffect', () => {
            const last = {
                f: 3,
                start: 0,
                stop: 1,
                effects: [{ effect: 'pull-off' }]
            },
            curr = {
                f: 3,
                start: 1,
                stop: 2
            }

            expect(pullEffect.effectObjIn(last.effects)).toBeTruthy()
            expect(pullEffect.applyEffect(last, curr)).toBeFalsy()
            expect(last.stop).toEqual(1)
            expect(last.effects).toBeUndefined()
            expect(curr.effects).toBeDefined()
        })

    })

    describe('PreBend Effect tests', () => {

        test('canApplyEffect', () => {
            expect(preBendEffect.canApplyEffect(undefined, undefined)).toBeFalsy()
            expect(preBendEffect.canApplyEffect(plainPart1, undefined)).toBeFalsy()
            expect(preBendEffect.canApplyEffect(undefined, preBendPart)).toBeFalsy()
            expect(preBendEffect.canApplyEffect(preBendPart, plainPart1)).toBeTruthy()
            expect(preBendEffect.canApplyEffect(slidePart, preBendPart)).toBeFalsy()
        })

        test('applyEffect', () => {
            const last = {
                f: 4,
                start: 0,
                stop: 1,
                effects: [{ effect: 'pre-bend' }]
            },
            curr = {
                f: 3,
                start: 1,
                stop: 2
            }

            expect(preBendEffect.effectObjIn(last.effects)).toBeTruthy()
            expect(preBendEffect.applyEffect(last, curr)).toBeTruthy()
            expect(last.stop).toEqual(2)
            expect(last.effects).toBeDefined()
            expect(curr.effects).toBeUndefined()
        })

    })

    describe('Harmonic Effect tests', () => {

        test('canApplyEffect', () => {
            expect(harmonicEffect.canApplyEffect(undefined, undefined)).toBeFalsy()
            expect(harmonicEffect.canApplyEffect(plainPart1, undefined)).toBeFalsy()
            expect(harmonicEffect.canApplyEffect(undefined, harmonicPart)).toBeTruthy()
            expect(harmonicEffect.canApplyEffect(harmonicPart, plainPart1)).toBeFalsy()
            expect(harmonicEffect.canApplyEffect(slidePart, harmonicPart)).toBeTruthy()
        })

        test('applyEffect', () => {
            const last = {
                f: 3,
                start: 0,
                stop: 1
            },
            curr = {
                start: 1,
                stop: 2,
                f: 12,
                effects: [{ effect: 'harmonic' }]
            }

            expect(harmonicEffect.effectObjIn(curr.effects)).toBeTruthy()
            expect(harmonicEffect.applyEffect(last, curr)).toBeFalsy()
            expect(last.stop).toEqual(1)
            expect(curr.effects).toBeDefined()
            expect(last.effects).toBeUndefined()
        })

    })
})