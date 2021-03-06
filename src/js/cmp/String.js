import React, { Component } from 'react'

/**
 * Renders a line that represents a string which can receive clicks and drag events
 */
export class String extends Component {

    constructor(props) {
        super(props);

        this.handleClick = this.handleClick.bind(this);
        this.handleDragOver = this.handleDragOver.bind(this);
        this.handleDrop = this.handleDrop.bind(this);
    }

    handleClick(e) {
        this.props.onClick(this.props.index, e);
    }

    handleDragOver(evt) {
        this.props.onDragOver(this.props.index, evt)
    }

    handleDrop(evt) {
        evt.preventDefault()
        this.props.onDrop(this.props.index, evt)
    }

    render() {
        const offset = this.props.offset + 'em';

        return (
            <div style={{ position: 'relative' }}  >
                <div className={'string ' + (this.props.locked ? '' : 'clickable')} style={{ height: '1px', width: '100%', position: 'absolute', top: offset }} onClick={this.handleClick} />
                <div className={(this.props.locked ? '' : 'clickable')} onClick={this.handleClick} onMouseUp={this.handleMouseUp} onDragOver={this.handleDragOver}
                    onDrop={this.handleDrop}
                    style={{
                        zIndex: 10,
                        height: 2 * this.props.boxHeight + 'em', position: 'absolute', top: this.props.offset - this.props.boxHeight + 'em', width: '100%'
                    }}
                />
            </div>
        )
    }
}