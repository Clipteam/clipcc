import PropTypes from 'prop-types'

export default PropTypes.shape({
    formatDate: PropTypes.func,
    formatTime: PropTypes.func,
    formatRelative: PropTypes.func,
    formatNumber: PropTypes.func,
    formatPlural: PropTypes.func,
    formatMessage: PropTypes.func,
    formatHTMLMessage: PropTypes.func,
    locale: PropTypes.string,
    timeZone: PropTypes.string,
    formats: PropTypes.object,
    messages: PropTypes.object,
    textComponent: PropTypes.any,
    defaultLocale: PropTypes.string,
    defaultFormats: PropTypes.object,
    onError: PropTypes.func
})
