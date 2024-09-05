import React from 'react';
import { connect } from 'react-redux';
import { initCtx } from 'clipcc-extension';
import { Manager } from 'clipcc-extension';
import VirtualMachine from 'clipcc-vm';

interface CCXManagerProps {
    vm: VirtualMachine;
    ccx: Manager;
    [key: string]: any;
}

interface State {
    scratchGui: {
        vm: VirtualMachine;
        ccx: Manager;
    };
}

/*
 * Higher Order Component to initialize CCX.
 * @param {React.ComponentType<any>} WrappedComponent component to manage CCX for
 * @returns {React.ComponentClass<Omit<CCXManagerProps, 'vm' | 'ccx'>>} connected component with ccx bound to redux
 */
const ccxManagerHOC = function <P extends CCXManagerProps>(
    WrappedComponent: React.ComponentType<P>
): React.ComponentClass<Omit<P, 'vm' | 'ccx'>> {
    class CCXManager extends React.Component<P> {
        static displayName = `CCXManager(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

        constructor(props: P) {
            super(props);
            initCtx(props.vm);
        }

        render() {
            const {
                ...componentProps
            } = this.props;
            return (
                // @ts-ignore
                <WrappedComponent
                    {...componentProps as P}
                />
            );
        }
    }

    const mapStateToProps = (state: State): Pick<CCXManagerProps, 'vm' | 'ccx'> => ({
        vm: state.scratchGui.vm,
        ccx: state.scratchGui.ccx
    });

    // @ts-ignore
    return connect(mapStateToProps)(CCXManager) as unknown as React.ComponentClass<Omit<P, 'vm' | 'ccx'>>;
};

export default ccxManagerHOC;
