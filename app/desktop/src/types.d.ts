declare module '*.svg' {
    declare const value: string;
    export default value;
}

declare module '*.css' {
    declare const value: { [className: string]: string };
    export default value;
}

declare module 'react-intl' {
    import type React from 'react';

    interface InjectIntlOptions {
        intlPropName?: string;
        withRef?: boolean;
    }

    export interface MessageDescriptor {
        id: string;
        defaultMessage?: string;
        description?: string;
    }

    export interface IntlShape {
        formatMessage(
            descriptor: MessageDescriptor,
            values?: Record<string, React.ReactNode>
        ): string;
    }

    export function addLocaleData(localeData: unknown): void;
    export function defineMessages<T extends Record<string, MessageDescriptor>>(messages: T): T;
    export const FormattedMessage: React.ComponentType<
        MessageDescriptor & { values?: Record<string, React.ReactNode> }
    >;
    export const intlShape: { isRequired: unknown };
    export function injectIntl<P extends { intl: IntlShape }>(
        component: React.ComponentType<P>,
        options?: InjectIntlOptions
    ): React.ComponentType<Omit<P, 'intl'>>;
}
