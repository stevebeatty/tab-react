import React, { Component } from 'react'

var rulers = {}
function getRuler(intervals, subdivisions) {

    const idx = intervals + '/' + subdivisions;

    if (idx in rulers) {
        return rulers[idx]
    } else {
        var arr;
        if (subdivisions === 1) {
            arr = new Array(intervals).fill(1);
        } else {
            const r = getRuler(intervals, subdivisions / 2).slice();

            // insertBetween
            const newSize = r.length * 2;
            if (newSize === 1) {
                return r
            }

            arr = new Array(newSize);
            for (var i = 0; i < r.length; i++) {
                arr[2 * i] = r[i]
                arr[2 * i + 1] = subdivisions
            }
        }

        rulers[idx] = arr;
        return arr;
    }
}

/**
 * Renders a ruler underneath a measure that responds to clicks on tick marks
 */
export class Ruler extends Component {

    constructor(props) {
        super(props)

        this.state = {}

        this.indicatorRef = React.createRef()
        this.endAnimation = this.endAnimation.bind(this)
        this.rulerMarkClick = this.rulerMarkClick.bind(this)
    }

    static getDerivedStateFromProps(props, state) {
        if (props.showIndicator && !state.isShowingIndicator) {
            return {
                startAnimation: true
            }
        }

        return null
    }

    componentWillUnmount() {
        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.cancel()
        }
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (this.state.startAnimation) {
            const dist = this.props.subdivisionSpacing * this.props.subdivisions * this.props.d
            console.log('animate', this.props.measure.key, this.props.currentTime, this.props.totalTime, prevState)
            const animation = this.indicatorRef.current.animate([
                // keyframes
                { transform: 'translateX(0em)' },
                { transform: 'translateX(' + dist + 'em)' },

            ], {
                    // timing options
                    duration: this.props.totalTime * 1000,
                    iterations: 1
                }
            )

            animation.onfinish = this.endAnimation

            this.setState({
                isShowingIndicator: true,
                indicatorAnimation: animation,
                startAnimation: false
            })

        } else if (!this.props.showIndicator && this.state.isShowingIndicator) {
            this.setState({
                isShowingIndicator: false
            })
        }

        if (this.props.isPaused && !prevProps.isPaused) {
            console.log('pause')
            this.pauseAnimation()
        } else if (!this.props.isPaused && prevProps.isPaused) {
            console.log('play')
            this.playAnimation()
        }
    }

    pauseAnimation() {
        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.pause()
        }
    }

    playAnimation() {
        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.play()
        }
    }

    endAnimation() {
        if (this.indicatorRef.current) {
            this.indicatorRef.current.style.visibility = 'hidden'
        }

        if (this.state.indicatorAnimation) {
            this.state.indicatorAnimation.cancel()

            this.setState({
                isShowingIndicator: false,
                indicatorAnimation: null
            })
        }
    }

    tickXPostition(index) {
        return this.props.dx + (index * this.props.subdivisionSpacing);
    }

    tickHeight(index, subdivs) {
        return 0.8 * this.props.subdivisionSpacing - 0.65 * this.props.subdivisionSpacing / subdivs;
    }

    rulerMarkClick(evt) {
        const pos = parseFloat(evt.target.dataset.position, 10)
        this.props.onRulerClick(pos)
    }

    render() {
        const ticks = getRuler(this.props.d, this.props.subdivisions);
        const bottom = this.props.subdivisionSpacing - 0.1,
            tickClickWidth = 0.6 * this.props.subdivisionSpacing

        return (
            <svg width={this.props.width + 'em'} height={this.props.height + 'em'} style={{ position: 'absolute', top: this.props.y - this.props.height + 'em' }}>
                <g className="ruler">
                    <line className="string"
                        x1="0" y1={bottom + 'em'}
                        x2="100%" y2={bottom + 'em'} />
                    {ticks.map((i, idx) => (
                        <g key={idx}>
                            <line className={"ruler-tick"}
                                x1={this.tickXPostition(idx) + 'em'}
                                x2={this.tickXPostition(idx) + 'em'}
                                y1={this.tickHeight(idx, i) + 'em'}
                                y2={bottom + 'em'}
                            />
                            <rect className="clickable" x={this.tickXPostition(idx) - 0.5 * tickClickWidth + 'em'} y={0} width={tickClickWidth + 'em'} height={this.props.height + 'em'}
                                onClick={this.rulerMarkClick} style={{ zIndex: 20 }} fill="transparent" data-position={idx / this.props.subdivisions} />
                        </g>
                    ))}

                    {<line ref={this.indicatorRef} className={"ruler-tick"} style={{
                        stroke: 'blue',
                        visibility: this.state.isShowingIndicator ? 'visible' : 'hidden'
                    }}
                        x1={this.props.dx + 'em'}
                        x2={this.props.dx + 'em'}
                        y1={0.3 + 'em'}
                        y2={bottom + 'em'}
                    />}

                </g>
            </svg>
        )
    }
}