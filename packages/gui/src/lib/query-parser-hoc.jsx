import React from 'react';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';


/* Higher Order Component to get parameters from the URL query string and initialize redux state
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with query parsing behavior
 */
const QueryParserHOC = function (WrappedComponent) {
    class QueryParserComponent extends React.Component {
        constructor (props) {
            super(props);
        }
        render () {
            const {
                onOpenTipsLibrary, // eslint-disable-line no-unused-vars
                onUpdateReduxDeck, // eslint-disable-line no-unused-vars
                ...componentProps
            } = this.props;
            return (
                <WrappedComponent
                    {...componentProps}
                />
            );
        }
    }
    QueryParserComponent.propTypes = {
        onOpenTipsLibrary: PropTypes.func,
        onUpdateReduxDeck: PropTypes.func
    };
    const mapDispatchToProps = dispatch => ({
    });
    return connect(
        null,
        mapDispatchToProps
    )(QueryParserComponent);
};

export {
    QueryParserHOC as default
};
