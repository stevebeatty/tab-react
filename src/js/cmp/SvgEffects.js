import React, { Component } from 'react'

export class SvgWavePath extends Component {

    constructor(props) {
        super(props)
    }

    generateCycles(cycleCount, cfg) {
        const unit = cfg.unit

        let d = `M ${cfg.startPoint.x + unit} ${cfg.startPoint.y + unit}`
            + ` c ${cfg.curveDeltas.startCtrl.dx + unit} ${cfg.curveDeltas.startCtrl.dy + unit}, ${cfg.curveDeltas.endCtrl.dx + unit} ${cfg.curveDeltas.endCtrl.dy + unit}, ${cfg.curveDeltas.end.dx + unit} ${cfg.curveDeltas.end.dy + unit}`

        const whole = Math.floor(cycleCount),
            fract = cycleCount - whole

        let count = whole * 2 + (fract >= 0.5 ? 1 : 0),
            sign = 1

        while (count > 0) {
            if (count % 2 === 0) {
                sign = -1
            } else {
                sign = 1
            }

            d += ` s ${cfg.pointDist + unit} ${sign * cfg.curveAmp + unit}, ${cfg.ctrlOffset + cfg.pointDist + unit} 0`

            count--
        }

        return d
    }

    render() {
        const height = this.props.height,
            width = this.props.width,
            cyclesPerEm = this.props.cyclesPerEm,
            curveAmp = this.props.amplitude * height / 2,
            pointDist = 1 / (width * cyclesPerEm),
            ctrlOffset = pointDist / 2,
            cfg = {
                unit: '',
                height: height,
                width: width,
                startPoint: { x: 0, y: height / 2 },
                curveAmp: curveAmp,
                pointDist: pointDist,
                ctrlOffset: ctrlOffset,
                curveDeltas: {
                    startCtrl: { dx: ctrlOffset, dy: -curveAmp },
                    endCtrl: { dx: pointDist, dy: -curveAmp },
                    end: { dx: ctrlOffset + pointDist, dy: 0 }
                }
            }

        return (
            <svg viewBox={"0 0 " + cfg.width + " " + height} width={cfg.width + 'em'} height={height + 'em'} x={this.props.x + 'em'}>
                <path d={this.generateCycles(width * cyclesPerEm, cfg)} className={this.props.pathClass}
                    stroke="black" vectorEffect="non-scaling-stroke" fill="transparent" />
            </svg>
        )
    }
}

export class SvgBend extends Component {

    render() {
        const width = this.props.width - this.props.x,
            height = this.props.height,
            ctrlY = 0.1 * height,
            heightExtent = 0.6,
            widthExtent = 0.9 * width,
            direction = this.props.direction || 1,
            offset = this.props.offset || 0,
            //pathD = `M 0 ${.5 * height} l ${width * .5} 0 c ${width * .05} ${.5 * -height} ${width * .05} ${.5 * -height} ${width * .05} ${.5 * -height} l 0 ${0.4 * -height}`
            pathD = `M 0 ${.5 * height + offset} l ${width * .25} 0 c ${width * .25} 0 ${width * .25} 0 ${width * .25} ${-0.4 * direction * height}`

        return (
            <svg width={width + 'em'} height={height + 'em'} viewBox={`0 0 ${width} ${height}`} x={this.props.x + 'em'} >
                <defs>
                    <marker id='head' viewBox="0 0 40 40" orient="auto"
                        markerWidth='1' markerHeight='1'
                        refX='5' refY='5'>
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
                <path d={pathD} fill="none" strokeWidth="1.5" className={this.props.pathClass + '-stroke'} vectorEffect="non-scaling-stroke" markerEnd='url(#head)' />
            </svg>
        )
    }
}


export class SvgArc extends Component {

    render() {
        const width = this.props.width - this.props.x,
            height = this.props.height,
            ctrlY = 0.9 * height,
            heightExtent = 0.6,
            widthExtent = 0.95 * width,
            direction = this.props.direction || 1,
            pathD = `M 0.1 ${.5 * height} q ${width * .5} ${direction * -ctrlY}, ${widthExtent} 0`

        return (
            <svg width={width + 'em'} height={height + 'em'} viewBox={`0 0 ${width} ${height}`} x={this.props.x + 'em'} >
                <path d={pathD} fill="transparent" strokeWidth="1.5" stroke="black" vectorEffect="non-scaling-stroke" />
            </svg>
        )
    }
}

