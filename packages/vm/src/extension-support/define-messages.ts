export interface MessageDescriptor {
    /** the translator-friendly unique ID of this message */
    id: string;
    /** the message text in the default language (English) */
    default: string;
    /** a description of this message to help translators understand the context */
    description?: string;
}

/**
 * This is a hook for extracting messages from extension source files.
 * This function simply returns the message descriptor map object that's passed in.
 * @param messages the messages to be defined
 * @returns the input, unprocessed
 */
const defineMessages = function (messages: Record<string, MessageDescriptor>): Record<string, MessageDescriptor> {
    return messages;
};

export default defineMessages;
