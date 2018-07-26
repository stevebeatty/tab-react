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

    /**
     * Applies the effect and returns true if the effect from curr
     * has been merged into last
     * 
     * @param {any} last
     * @param {any} curr
     */
    applyEffect(last, curr) {
        return false
    }

    effectObjIn(iterable) {
        if (!iterable) return false

        for (const obj of iterable) {
            if (obj.effect === this.name) {
                return obj
            }
        }

        return false
    }

    unappliedEffectObjIn(iterable) {
        const eff = this.effectObjIn(iterable)
        return eff && !eff.applied ? eff : null
    }

    applyEffectObj(effectObj, obj) {
        Object.assign(effectObj, obj)
        effectObj.applied = true
    }

    static addEffectObjToPart(effectObj, part) {
        part.effects = part.effects || []
        part.effects.push(effectObj)
    }

    removeFirstEffectObjFromPart(part) {
        if (Array.isArray(part.effects)) {
            const idx = part.effects.findIndex(e => e.effect === this.name)
            if (idx >= 0) {
                const removed = part.effects.splice(idx, 1)
                if (part.effects.length === 0) {
                    delete part.effects
                }

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

        return true
    }
}

export class BaseSlideEffect extends Effect {
    constructor(name) {
        super(name)
    }

    canApplyEffect(last, curr) {
        return last && curr && this.unappliedEffectObjIn(last.effects)
    }

    applyEffect(last, curr) {
        const eff = this.unappliedEffectObjIn(last.effects)
        this.applyEffectObj(eff, {
            start: last.start, stop: curr.stop, transistionStop: last.stop, detune: (curr.f - last.f) * 100
        })

        last.stop = curr.stop

        return true
    }
}

export class VibratoEffect extends Effect {
    constructor() {
        super('vibrato')
    }

    canApplyEffect(last, curr) {
        return curr && this.unappliedEffectObjIn(curr.effects)
    }

    applyEffect(last, curr) {
        const eff = this.unappliedEffectObjIn(curr.effects)
        this.applyEffectObj(eff, { start: curr.start, stop: curr.stop } )

        return false
    }
}

export class BasePullEffect extends Effect {
    constructor(name) {
        super(name)
    }

    canApplyEffect(last, curr) {
        return last && curr && this.unappliedEffectObjIn(last.effects)
    }

    applyEffect(last, curr) {
        const eff = this.unappliedEffectObjIn(last.effects)
        this.applyEffectObj(eff, { start: curr.start, stop: curr.stop })
        Effect.addEffectObjToPart(eff, curr)

        this.removeFirstEffectObjFromPart(last)

        return false
    }
}

export class PreBendEffect extends Effect {
    constructor() {
        super('pre-bend')
    }

    canApplyEffect(last, curr) {
        return last && curr && this.unappliedEffectObjIn(last.effects)
    }

    applyEffect(last, curr) {
        const eff = this.unappliedEffectObjIn(last.effects),
            detuneEnd = curr ? curr.f : last.f - 2

        this.applyEffectObj(eff, { start: last.start, stop: last.stop, detune: (last.f - detuneEnd) * 100 })

        last.stop = curr ? curr.stop : last.stop

        return true
    }
}

export class HarmonicEffect extends Effect {
    constructor() {
        super('harmonic')
    }

    canApplyEffect(last, curr) {
        return curr && this.unappliedEffectObjIn(curr.effects)
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

        const eff = this.unappliedEffectObjIn(curr.effects)
        this.applyEffectObj(eff, { start: curr.start, stop: curr.stop, detune } )

        curr.f = 0

        return false
    }

}