import React, { Component } from 'react'
import { SvgWavePath, SvgBend, SvgArc } from './SvgEffects'

export class Note extends Component {

    constructor(props) {
        super(props)

        this.state = {
            isDragging: false
        }

        this.handleClick = this.handleClick.bind(this)
        this.handleDragStart = this.handleDragStart.bind(this)
        this.handleDragEnd = this.handleDragEnd.bind(this)
        this.handleDragOver = this.handleDragOver.bind(this)
        this.handleDrop = this.handleDrop.bind(this)
    }

    handleClick(e) {
        const bound = e.target.getBoundingClientRect()
        console.log('click', e.pageX, bound.left, e.target)
        this.props.onClick(this.props.string, this.props.index, this.props.note, e)
    }

    handleDragStart(evt) {
        console.log('note dragstart')

        this.props.onDragStart({
            measure: this.props.measure,
            string: this.props.string,
            note: this.props.note,
            noteIndex: this.props.index
        }, evt, this.props.selected)

        this.setState({
            isDragging: true
        })
    }

    handleDragEnd(evt) {
        //console.log('dragend')
        this.props.onDragEnd(evt)

        this.setState({
            isDragging: false
        })
    }

    handleDragOver(evt) {
        //console.log('handleDragOver')
        this.props.onDragOver(this.props.string, evt)
    }

    handleDrop(evt) {
        console.log('handleDrop')
        this.props.onDrop(this.props.string, evt)
    }

    render() {
        const rectHeight = 0.2,
            imgHeight = 1.5,
            imgLeft = .75,
            imgMiddle = imgHeight / 2,
            hasEffect = 'effect' in this.props.note,
            isContinued = 'continues' in this.props.note


        const x = this.props.x + 'em';
        const y = this.props.y + 'em';

        const slideHeight = 0.35

        return (
            <div draggable={this.props.canDrag} onDragStart={this.handleDragStart} onDragEnd={this.handleDragEnd}
                onDragOver={this.handleDragOver} onDrop={this.handleDrop}
                className={'note ' + (this.state.isDragging ? 'note-dragging' : 'note-default-state')}
                style={{
                    position: 'absolute',
                    width: this.props.d + imgLeft + 'em',
                    left: this.props.x - imgLeft + 'em',
                    top: this.props.y - imgHeight / 2 + 'em',
                    height: imgHeight + 'em',
                    pointerEvents: 'auto'
                }}>
                <svg className={(hasEffect ? 'note-with-effect' : '')}
                    style={{ width: this.props.d + imgLeft + 'em', height: imgHeight + 'em' }}>

                    <rect className={"note-extent string-" + this.props.string}
                        x={imgLeft + 'em'}
                        y={imgMiddle - rectHeight / 2 + 'em'}
                        width={this.props.d + 'em'}
                        height="0.2em"
                        onClick={this.handleClick} />

                    {this.props.note.effect === 'vibrato' && <SvgWavePath width={this.props.d + imgLeft} height={imgHeight} x={imgLeft} cyclesPerEm={1}
                        amplitude={0.6} pathClass={"string-" + this.props.string + '-stroke'} />}

                    {this.props.note.effect === 'slide-up' && <line x1={imgLeft + 'em'} x2={imgLeft + this.props.d + 'em'} y1={imgMiddle + slideHeight + 'em'} y2={imgMiddle - slideHeight + 'em'}
                        className={"string-" + this.props.string + '-stroke'} strokeWidth="1.5" stroke="black" vectorEffect="non-scaling-stroke" />}

                    {this.props.note.effect === 'slide-down' && <line x1={imgLeft + 'em'} x2={imgLeft + this.props.d + 'em'} y1={imgMiddle - slideHeight + 'em'} y2={imgMiddle + slideHeight + 'em'}
                        className={"string-" + this.props.string + '-stroke'} strokeWidth="1.5" stroke="black" vectorEffect="non-scaling-stroke" />}

                    {this.props.note.effect === 'bend-up' && <SvgBend width={this.props.d + imgLeft} height={imgHeight} x={imgLeft} pathClass={"string-" + this.props.string} />}

                    {this.props.note.effect === 'pre-bend' && <SvgBend width={this.props.d + imgLeft} height={imgHeight} x={imgLeft} pathClass={"string-" + this.props.string} direction={-1} offset={- 0.45 * imgHeight} />}

                    {(this.props.note.effect === 'pull-off' || this.props.note.effect === 'hammer-on') && <SvgArc width={this.props.d + imgLeft} height={imgHeight} x={imgLeft} pathClass={"string-" + this.props.string} />}

                    {this.props.selected &&
                        <circle className="selected-note" cx={imgLeft + 'em'}
                            cy={imgMiddle + 'em'}
                            r={this.props.layout.noteRadius() + 0.05 + 'em'} />}

                    <text className={"note-text-outline clickable"}
                        x={imgLeft + 'em'}
                        y={imgMiddle + 'em'}
                        dy={this.props.dy + 'em'}
                        textAnchor="middle"
                        onClick={this.handleClick}
                    >{this.props.note.f}</text>

                    <text className={"note-text clickable"}
                        x={imgLeft + 'em'}
                        y={imgMiddle + 'em'}
                        dy={this.props.dy + 'em'}
                        textAnchor="middle"
                        onClick={this.handleClick}
                    >{this.props.note.f}</text>
                </svg>
            </div>
        )
    }
}