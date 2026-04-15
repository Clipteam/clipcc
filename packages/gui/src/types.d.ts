declare module '!!arraybuffer-loader!.*' {
    declare const value: ArrayBuffer;
    export default value;
}

declare module '*?raw' {
    declare const value: string;
    export default value;
}

declare module '*.svg' {
    declare const value: string;
    export default value;
}

declare module '*.css' {
    declare const value: { [className: string]: string };
    export default value;
}

declare module 'redux-throttle' {
    import type {Middleware} from 'redux';

    interface ThrottleOptions {
        leading?: boolean;
        trailing?: boolean;
    }

    const throttle: (delay: number, options?: ThrottleOptions) => Middleware;

    export default throttle;
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
        MessageDescriptor & {values?: Record<string, React.ReactNode>}
    >;
    export const intlShape: {isRequired: unknown};
    export function injectIntl<P extends {intl: IntlShape}>(
        component: React.ComponentType<P>,
        options?: InjectIntlOptions
    ): React.ComponentType<Omit<P, 'intl'>>;
}

declare module 'react-responsive' {
    import type React from 'react';

    interface MediaQueryProps {
        children?: React.ReactNode | ((matches: boolean) => React.ReactNode);
        minWidth?: number | string;
    }

    const MediaQuery: React.ComponentType<MediaQueryProps>;
    export default MediaQuery;
}

declare module 'react-tabs' {
    import type React from 'react';

    interface CommonProps {
        className?: string;
        children?: React.ReactNode;
    }

    interface TabsProps extends CommonProps {
        forceRenderTabPanel?: boolean;
        selectedIndex?: number;
        selectedTabClassName?: string;
        selectedTabPanelClassName?: string;
        onSelect?: (index: number, lastIndex: number, event: Event) => void | boolean;
    }

    interface TabProps extends CommonProps {
        onClick?: () => void;
    }

    export const Tabs: React.ComponentType<TabsProps>;
    export const TabList: React.ComponentType<CommonProps>;
    export const Tab: React.ComponentType<TabProps>;
    export const TabPanel: React.ComponentType<CommonProps>;
}
