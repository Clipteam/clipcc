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
    setExtendedXML(xml: string): void;
    addLocale(locale: Record<string, Record<string, string>>): void;
    store: any;
    [key: string]: any;
}

const ccxManagerHOC = function <P extends CCXManagerProps>(
    WrappedComponent: React.ComponentType<P>
): React.ComponentClass<Omit<P, 'vm' | 'manager'>> {
    class CCXManager extends React.Component<P> {
        constructor(props: P) {
            super(props);
            initCtx(props.vm, props.setExtendedXML, props.store); // Pass store to initCtx
            attachScratchBlocks(props.blocks);
            props.manager.registerAddGuiLocale(props.addLocale);
        }

        componentDidUpdate(prevProps: Readonly<P>): void {
            if (prevProps.blocks !== this.props.blocks) {
                attachScratchBlocks(this.props.blocks);
            }
        }

        render() {
            const {
                store,
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

    const mapStateToProps = (state: any): Pick<CCXManagerProps, 'vm' | 'manager' | 'blocks'> => ({
        vm: state.scratchGui.vm,
        blocks: state.scratchGui.blocks,
        manager: state.scratchGui.ccx.manager
    });

    const mapDispatchToProps = (dispatch: any) => ({
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
