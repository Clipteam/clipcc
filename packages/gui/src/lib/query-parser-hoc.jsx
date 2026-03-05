import React from 'react';
import PropTypes from 'prop-types';


/* Higher Order Component to get parameters from the URL query string and initialize redux state
 * @param {React.Component} WrappedComponent: component to render
 * @returns {React.Component} component with query parsing behavior
 */
const QueryParserHOC = function (WrappedComponent) {
    // eslint-disable-next-line react/prefer-stateless-function
    class QueryParserComponent extends React.Component {
        render () {
            const {
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
        onUpdateReduxDeck: PropTypes.func
    };
    return QueryParserComponent;
};

export {
    QueryParserHOC as default
};
