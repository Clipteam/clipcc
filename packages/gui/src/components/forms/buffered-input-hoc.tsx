import bindAll from 'lodash.bindall';
import React from 'react';

type BufferedValue = string | number;

interface BufferedInputProps {
    onBlur?: React.FocusEventHandler<HTMLInputElement>;
    onChange?: React.ChangeEventHandler<HTMLInputElement>;
    onKeyPress?: React.KeyboardEventHandler<HTMLInputElement>;
    onSubmit: (value: BufferedValue) => void;
    value?: BufferedValue;
}


interface BufferedInputState {
    value: string | null;
}

/**
 * Higher Order Component to manage inputs that submit on blur and <enter>
 * @param {React.Component} Input text input that consumes onChange, onBlur, onKeyPress
 * @returns {React.Component} Buffered input that calls onSubmit on blur and <enter>
 */
export default function <P extends BufferedInputProps> (Input: React.ComponentType<P>): React.ComponentType<P> {
    class BufferedInput extends React.Component<P, BufferedInputState> {
        constructor (props: P) {
            super(props);
            bindAll(this, [
                'handleChange',
                'handleKeyPress',
                'handleFlush'
            ]);
            this.state = {
                value: null
            };
        }
        handleKeyPress (e: React.KeyboardEvent<HTMLInputElement>) {
            if (e.key === 'Enter') {
                // handleFlush will be called when blur
                e.currentTarget.blur();
            }
        }
        handleFlush () {
            const isNumeric = typeof this.props.value === 'number';
            const validatesNumeric = isNumeric ? !Number.isNaN(Number(this.state.value)) : true;
            if (this.state.value !== null && validatesNumeric) {
                this.props.onSubmit(isNumeric ? Number(this.state.value) : this.state.value);
            }
            this.setState({value: null});
        }
        handleChange (e: React.ChangeEvent<HTMLInputElement>) {
            this.setState({value: e.target.value});
        }
        render () {
            const bufferedValue = this.state.value === null ? this.props.value : this.state.value;
            return (
                <Input
                    {...this.props}
                    value={bufferedValue}
                    onBlur={this.handleFlush}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                />
            );
        }
    }

    return BufferedInput;
}
