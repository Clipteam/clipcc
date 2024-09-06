import React from 'react';
import { connect } from 'react-redux';
import { initCtx, attachScratchBlocks } from 'clipcc-extension';
import type { Manager } from 'clipcc-extension';
import VirtualMachine from 'clipcc-vm';
import { setExtendedXML } from '../reducers/ccx';
import { addLocales, updateLocale } from '../reducers/locales';

type ScratchBlocks = any;

interface CCXManagerProps {
    vm: VirtualMachine;
    manager: Manager;
    blocks: ScratchBlocks;
    setExtendedXML (xml: string): void;
    addLocale (locale: Record<string, Record<string, string>>): void;
    [key: string]: any;
}

interface State {
    scratchGui: {
        vm: VirtualMachine;
        blocks: ScratchBlocks;
        ccx: {
            manager: Manager;
        };
    };
}

/*
 * Higher Order Component to initialize CCX.
 * @param {React.ComponentType<any>} WrappedComponent component to manage CCX for
 * @returns {React.ComponentClass<Omit<CCXManagerProps, 'vm' | 'ccx'>>} connected component with ccx bound to redux
 */
const ccxManagerHOC = function <P extends CCXManagerProps>(
    WrappedComponent: React.ComponentType<P>
): React.ComponentClass<Omit<P, 'vm' | 'manager'>> {
    class CCXManager extends React.Component<P> {
        constructor(props: P) {
            super(props);
            initCtx(props.vm, props.setExtendedXML);
            attachScratchBlocks(props.blocks);
            props.manager.registerAddLocale(props.addLocale);
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

    const mapStateToProps = (state: State): Pick<CCXManagerProps, 'vm' | 'manager' | 'blocks'> => ({
        vm: state.scratchGui.vm,
        blocks: state.scratchGui.blocks,
        manager: state.scratchGui.ccx.manager
    });

    const mapDispatchToProps = (dispatch) => ({
        setExtendedXML: (xml: string) => dispatch(setExtendedXML(xml)),
        addLocale: (locale: Record<string, Record<string, string>>) => {
            dispatch(addLocales(locale));
            dispatch(updateLocale());
        }
    });

    // @ts-ignore
    return connect(
        mapStateToProps,
        mapDispatchToProps
    // @ts-ignore
    )(CCXManager) as React.ComponentClass<Omit<P, 'vm' | 'manager'>>;
};

export default ccxManagerHOC;
