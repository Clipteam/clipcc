import React from 'react';
import { connect } from 'react-redux';
import { initCtx, attachScratchBlocks } from 'clipcc-extension';
import type { CCX, Manager } from 'clipcc-extension';
import VirtualMachine from 'clipcc-vm';
import { setExtendedXML } from '../reducers/ccx';
import { addLocales, updateLocale } from '../reducers/locales';
import { get } from 'idb-keyval';

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

let initialized = false;
async function loadPersistentCCX (manager: Manager) {
    if (initialized) return;
    
    const rawCCX = await get<Record<CCX.Manifest['id'], ArrayBuffer>>('persistentCCX');
    if (!rawCCX) {
        initialized = true;
        return;
    }
    const persistentCCXs = Object.values(rawCCX);
    manager.loadFromArrayBuffer(...persistentCCXs);
    initialized = true;
}

const ccxManagerHOC = function <P extends CCXManagerProps>(
    WrappedComponent: React.ComponentType<P>
): React.ComponentClass<Omit<P, 'vm' | 'manager' | 'blocks' | 'persistentCCX'>> {
    class CCXManager extends React.Component<P> {
        constructor(props: P) {
            super(props);
            initCtx(props.vm, props.setExtendedXML, props.store); // Pass store to initCtx
            attachScratchBlocks(props.blocks);
            props.manager.registerAddGuiLocale(props.addLocale);
            if (props.persistentCCX) {
                loadPersistentCCX(props.manager);
            }
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

    const mapStateToProps = (state: any): Pick<CCXManagerProps, 'vm' | 'manager' | 'blocks' | 'persistentCCX'> => ({
        vm: state.scratchGui.vm,
        blocks: state.scratchGui.blocks,
        persistentCCX: state.scratchGui.settings.persistentCCX,
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
    )(CCXManager) as React.ComponentClass<Omit<P, 'vm' | 'manager' | 'blocks' | 'persistentCCX'>>;
};

export default ccxManagerHOC;
