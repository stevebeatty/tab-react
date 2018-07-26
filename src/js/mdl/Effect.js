export class Effect {
    constructor(name) {
        this._name = name
    }

    get name() { return this._name }

    canCombine(effect) {
        return effect.name === this.name
    }

    canApplyEffect(lastPart, currPart) {
        return false
    }

    applyEffect(last, curr) {
        return false
    }

    isEffectIn(iterable) {
        for (const obj of iterable) {
            if (obj.effect === this.name) {
                return true
            }
        }

        return false
    }

    static seqPartAddEffect(part, effectObj) {
        part.effects = part.effects || []
        part.effects.push(effectObj)
    }

    static seqPartRemoveFirstEffect(part, effect) {
        if (Array.isArray(part.effects)) {
            const idx = part.effects.findIndex(e => e.effect === effect)
            if (idx >= 0) {
                const removed = part.effects.splice(idx, 1)
                return removed.length > 0 ? removed[0] : null
            }
        }

        return null
    }
}

export class NoEffect extends Effect {
    constructor() {
        super(undefined)
    }

    canApplyEffect(last, curr) {
        return last && curr && last.f === curr.f
    }

    applyEffect(last, curr) {
        last.stop = curr.stop
        return false
    }
}

export class BaseSlideEffect extends Effect {
    constructor(name) {
        super(name)
    }

    canApplyEffect(last, curr) {
        return last && curr && last.effect === this.name
    }

    applyEffect(last, curr) {
        const removed = Effect.seqPartRemoveFirstEffect(last, last.effect)
        Effect.seqPartAddEffect(last, {
            effect: last.effect, start: last.start, stop: curr.stop, transistionStop: last.stop, detune: (curr.f - last.f) * 100
        })
        last.stop = curr.stop
        delete last.effect

        return false
    }
}

export class VibratoEffect extends Effect {
    constructor() {
        super('vibrato')
    }

    canApplyEffect(last, curr) {
        return curr && curr.effect === this.name
    }

    applyEffect(last, curr) {
        Effect.seqPartAddEffect(last, { effect: curr.effect, start: curr.start, stop: curr.stop })
        last.stop = curr.stop
        return false
    }
}

export class BasePullEffect extends Effect {
    constructor(name) {
        super(name)
    }

    canApplyEffect(last, curr) {
        return last && curr && last.effect === this.name
    }

    applyEffect(last, curr) {
        Effect.seqPartAddEffect(curr, {
            effect: last.effect, start: curr.start, stop: curr.stop
        })
        delete last.effect

        return true
    }
}

export class PreBendEffect extends Effect {
    constructor() {
        super('pre-bend')
    }

    canApplyEffect(last, curr) {
        console.log('can apply effect', last, curr)
        return last && curr && last.effect === this.name
    }

    applyEffect(last, curr) {
        const removed = Effect.seqPartRemoveFirstEffect(last, last.effect),
            detuneEnd = curr ? curr.f : last.f - 2
        Effect.seqPartAddEffect(last, {
            effect: last.effect, start: last.start, stop: last.stop, detune: (last.f - detuneEnd) * 100
        })
        last.stop = curr ? curr.stop : last.stop
        console.log('effobj', last)

        delete last.effect

        return false
    }
}

export class HarmonicEffect extends Effect {
    constructor() {
        super('harmonic')
    }

    canApplyEffect(last, curr) {
        return curr && curr.effect === this.name
    }

    applyEffect(last, curr) {
        let detune = curr.f * 100
        if (curr.f === 12) {
            detune = 1200
        } else if (curr.f === 7 || curr.f === 19) {
            detune = 1900
        } else if (curr.f === 5 || curr.f === 24) {
            detune = 2400
        }

        Effect.seqPartAddEffect(curr, {
            effect: curr.effect, start: curr.start, stop: curr.stop, detune
        })

        curr.f = 0

        delete curr.effect

        return true
    }

}