import formatMessage from 'format-message';

/**
 * Check if `maybeMessage` looks like a message object, and if so pass it to `formatMessage`.
 * Otherwise, return `maybeMessage` as-is.
 * @param maybeMessage - something that might be a message descriptor object.
 * @param [args] - the arguments to pass to `formatMessage` if it gets called.
 * @param [locale] - the locale to pass to `formatMessage` if it gets called.
 * @returns - the formatted message OR the original `maybeMessage` input.
 */
const maybeFormatMessage = function (maybeMessage: unknown, args?: Record<string, unknown>, locale?: string): unknown {
    if (maybeMessage && (maybeMessage as Record<string, unknown>).id && (maybeMessage as Record<string, unknown>).default) {
        return formatMessage(maybeMessage as { id: string; default: string }, args, locale);
    }
    return maybeMessage;
};

export default maybeFormatMessage;
