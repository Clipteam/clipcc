import bindAll from 'lodash.bindall';
import React from 'react';
import type AppStateHOC from 'clipcc-gui/src/lib/app-state-hoc';

type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;

/**
 * Higher-order component to add desktop logic to AppStateHOC.
 * @param WrappedComponent an AppStateHOC-like component to wrap.
 * @returns a component similar to AppStateHOC with desktop-specific logic added.
 */
const ScratchDesktopAppStateHOC = function <P extends PropsOf<typeof AppStateHOC>> (
    WrappedComponent: React.ComponentType<P>
) {
    class ScratchDesktopAppStateComponent extends React.Component<P, { telemetryDidOptIn: boolean }> {
        constructor (props: P) {
            super(props);
            bindAll(this, [
                'handleTelemetryModalOptIn',
                'handleTelemetryModalOptOut'
            ]);
            this.state = {
                // use `sendSync` because this should be set before first render
                telemetryDidOptIn: false
            };
        }
        handleTelemetryModalOptIn () {
        }
        handleTelemetryModalOptOut () {
        }
        render () {
            const shouldShowTelemetryModal = false;

            return (
                <WrappedComponent
                    isTelemetryEnabled={this.state.telemetryDidOptIn}
                    onTelemetryModalOptIn={this.handleTelemetryModalOptIn}
                    onTelemetryModalOptOut={this.handleTelemetryModalOptOut}
                    showTelemetryModal={shouldShowTelemetryModal}

                    // allow passed-in props to override any of the above
                    {...this.props}
                />
            );
        }
    }

    return ScratchDesktopAppStateComponent;
};

export default ScratchDesktopAppStateHOC;
