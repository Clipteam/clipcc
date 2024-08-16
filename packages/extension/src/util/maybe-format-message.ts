import formatMessage, { Locales, Message } from 'format-message';
/**
 * Check if `maybeMessage` looks like a message object, and if so pass it to `formatMessage`.
 * Otherwise, return `maybeMessage` as-is.
 * @param {*} maybeMessage - something that might be a message descriptor object.
 * @param {object} [args] - the arguments to pass to `formatMessage` if it gets called.
 * @param {string} [locale] - the locale to pass to `formatMessage` if it gets called.
 * @return {string|*} - the formatted message OR the original `maybeMessage` input.
 */
export const maybeFormatMessage = function<T> (maybeMessage: T, args?: object, locale?: Locales) {
    if (maybeMessage && typeof maybeMessage === 'object' && 'id' in maybeMessage && 'default' in maybeMessage) {
        return formatMessage(maybeMessage as Message, args, locale);
    }
    return maybeMessage;
};
