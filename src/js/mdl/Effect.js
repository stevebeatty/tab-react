/**
 * A base class for different types of effects that is used to apply effects
 * or to determine if effects can be combined
 */
export class Effect {
    constructor(name) {
        this._name = name
    }

    /**
     * The name of the effect
     */
    get name() { return this._name }

    /**
     * Whether this effect can combine with another
     * 
     * @param {any} effect
     */
    canCombine(effect) {
        return effect.name === this.name
    }

    /**
     * Whether this effect can be applied given the argument parts
     * 
     * @param {any} lastPart
     * @param {any} currPart
     */
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

    /**
     * Whether an iterable contains an effect object with this effect's name.  Returns
     * the effect object or false if not found
     * 
     * @param {any} iterable
     */
    effectObjIn(iterable) {
        if (!iterable) return false

        for (const obj of iterable) {
            if (obj.effect === this.name) {
                return obj
            }
        }

        return false
    }

    /**
     * Returns an effect object that has not been applied yet from the iterable or null
     * if none found
     * 
     * @param {any} iterable
     */
    unappliedEffectObjIn(iterable) {
        const eff = this.effectObjIn(iterable)
        return eff && !eff.applied ? eff : null
    }

    /**
     * Assigns the fields from obj to effectObj and sets the applied field to true
     * 
     * @param {any} effectObj
     * @param {any} obj
     */
    applyEffectObj(effectObj, obj) {
        Object.assign(effectObj, obj)
        effectObj.applied = true
    }

    /**
     * Adds an effect object to a part
     * 
     * @param {any} effectObj
     * @param {any} part
     */
    static addEffectObjToPart(effectObj, part) {
        part.effects = part.effects || []
        part.effects.push(effectObj)
    }

    /**
     * Removes the first effect object from part that has the same name as this effect
     * 
     * @param {any} part
     */
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

/**
 * Used for notes that have no assigned effect
 */
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

/**
 * Used for effects that are slides or for bending
 */
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

/**
 * A vibratro effect
 */
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

/**
 * Used for pull-off or hammer-on effects
 */
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

/**
 * An effect where a note is bent before playing and then released
 */
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

/**
 * Simulates a harmonic effect on a string and is only defined for certain frets
 */
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