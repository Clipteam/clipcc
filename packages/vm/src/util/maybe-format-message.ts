import formatMessage, {Message} from 'format-message';

const isMessage = (maybeMessage: unknown): maybeMessage is Message => typeof maybeMessage === 'string' ||
    (
        typeof maybeMessage === 'object' && maybeMessage !== null && 'id' in maybeMessage && 'default' in maybeMessage
    );

/**
 * Check if `maybeMessage` looks like a message object, and if so pass it to `formatMessage`.
 * Otherwise, return `maybeMessage` as-is.
 * @param maybeMessage - something that might be a message descriptor object.
 * @param args - the arguments to pass to `formatMessage` if it gets called.
 * @param locale - the locale to pass to `formatMessage` if it gets called.
 * @returns the formatted message OR the original `maybeMessage` input.
 */
const maybeFormatMessage = function<T> (
    maybeMessage: T,
    args?: Record<string, unknown>,
    locale?: string
): T extends Message ? string : T {
    if (isMessage(maybeMessage)) {
        return formatMessage(maybeMessage, args, locale) as T extends Message ? string : T;
    }
    return maybeMessage as T extends Message ? string : T;
};

export default maybeFormatMessage;
