import PropTypes from 'prop-types';
import React from 'react';

class ThemeProvider extends React.Component {
    constructor (props) {
        super(props);
        this.ref = null;
    }
    
    componentDidMount () {
        if (!this.ref) return;
        for (const propName in this.props.theme) {
            const kebabCase =  propName.replace(/[A-Z]/g, (item) => {
                return '-'+item.toLowerCase();
            }).trim();
            const value = this.props.theme[propName];
            this.ref.style.setProperty(`--clipcc-${kebabCase}`, String(value));
        }
    }
    
    render () {
        return (
            <div ref={ref => this.ref = ref}>
                {this.props.children}
            </div>
        );
    }
}

ThemeProvider.propTypes = {
    theme: PropTypes.object.isRequired,
    children: PropTypes.node
};

export default ThemeProvider;
