import { CCX } from "./types/ccx";
import * as JSZip from 'jszip';
import Graph from "./util/graph";
import { matchVersion } from "./util/version";
import mime from 'mime-types';
import { scratchBlocks } from "./ctx";

const enum ERROR {
    UNAVAILABLE_EXTENSION = 0x90,
    CIRCULAR_REQUIREMENT,
    MISSING_MANIFEST,
    MISSING_ENTRY,
    MISSING_EXPORTS
}

const enum LoadMode {
    UNLOAD,
    INITIATIVE_LOAD,
    PASSIVE_LOAD
};

interface RequireInfo {
    id: CCX.Manifest['id'];
    version: CCX.Manifest['version'];
}

class Manager {
    private manifests: Record<CCX.Manifest['id'], CCX.Manifest> = {};
    private instances: Record<CCX.Manifest['id'], CCX.Class> = {};
    private scripts: Record<CCX.Manifest['id'], string> = {};

    async loadFromArrayBuffer (...extensions: ArrayBuffer[]): Promise<void> {
        for (const extension of extensions) {
            const zipData = await JSZip.loadAsync(extension);

            // Validate
            if (!('info.json' in zipData.files)) throw ERROR.MISSING_MANIFEST;
            if (!('main.js' in zipData.files)) throw ERROR.MISSING_ENTRY;

            const manifest: CCX.Manifest = JSON.parse(await zipData.files['info.json'].async('text'));
            
            if ('icon' in manifest) {
                const data = await zipData.files[manifest.icon].async('arraybuffer');
                manifest.icon = URL.createObjectURL(new Blob(
                    [data], { type: mime.lookup(manifest.icon) || 'image/png' }
                ));
            }

            if ('inset_icon' in manifest) {
                const data = await zipData.files[manifest.inset_icon].async('arraybuffer');
                manifest.inset_icon = URL.createObjectURL(new Blob(
                    [data], { type: mime.lookup(manifest.inset_icon) || 'image/svg+xml' }
                ));
            }

            // Load locales
            const locales: Record<string, CCX.LocaleMap> = {};
            for (const fileName in zipData.files) {
                const result = fileName.match(/^locales\/([A-Za-z0-9_-]+).json$/);
                if (result) {
                    locales[result[1]] = JSON.parse(await zipData.files[fileName].async('text'));
                }
            }
            if ('default_language' in manifest && manifest.default_language! in locales) { // default language param
                locales.default = locales[manifest.default_language!];
            } else {
                locales.default = locales.en;
            }

            // Load settings
            if ('settings.json' in zipData.files) {
                const content = await zipData.files['settings.json'].async('text');
                const settings: CCX.Settings = JSON.parse(content);
                // @todo
            }

            // Load locales before ``main.js`` executed to prevent block locale issues.
            this.addGuiLocale(locales);
            scratchBlocks.ScratchMsgs.locales.appendLocales(locales);

            // Store script
            const script = await zipData.files['main.js'].async('text');
            this.scripts[manifest.id] = script;
        }
    }

    async enable (...extensionIds: CCX.Manifest['id'][]) {
        const orderedExtensionIds = this.getExtensionLoadOrder(extensionIds);
        for (const {id, mode} of orderedExtensionIds) {
            const script = this.scripts[id];
            const manifest = this.manifests[id];
            const ExportedClass = eval(script);
            if (!ExportedClass) {
                throw {
                    error: ERROR.MISSING_EXPORTS,
                    id
                };
            }

            const instance = new ExportedClass();
            if ('onInit' in instance) {
                instance.onInit();
                if (manifest.api > 1) {
                    console.warn('onInit() has been deprecated since CCX V2, use constructor instead.');
                }
            }
            this.instances[id] = instance as CCX.Class;
        }
    }

    /**
     * Get the correct loading order.
     * @param extensions The list of extension ID.
     */
    getExtensionLoadOrder (extensions: CCX.Manifest['id'][]) {
        const graph = new Graph();
        for (const extensionId of extensions) {
            if (!(extensionId in this.manifests)) {
                console.error(`Unavailable extension: ${extensionId}`);
                throw {
                    code: ERROR.UNAVAILABLE_EXTENSION,
                    extension: [{ id: extensionId, version: 'any' }],
                    requireStack: []
                };
            }
            this._checkExtensionLoadingOrderById(extensionId, [], graph);
        }
        return graph.topo().map(id => ({
            id: id,
            mode: extensions.includes(id) ? LoadMode.INITIATIVE_LOAD : LoadMode.PASSIVE_LOAD
        }));
    }

    private _hasRequired (id: CCX.Manifest['id'], list: RequireInfo[]) {
        for (const i in list) {
            if (list[i].id === id) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get loading order of the extension with given id.
     * @param extensionId The extension id.
     * @param requireStack Require stack.
     * @param graph Load order.
     */
    private _checkExtensionLoadingOrderById(extensionId: CCX.Manifest['id'], requireStack: RequireInfo[], graph: Graph) {
        requireStack.push({
            id: extensionId,
            version: this.manifests[extensionId].version
        });
        if (!graph.hasNode(extensionId)) {
            graph.addNode(extensionId);
        }
        for (const dependency in this.manifests[extensionId].dependency) {
            if (!(dependency in this.manifests)) {
                throw {
                    code: ERROR.UNAVAILABLE_EXTENSION,
                    extension: [{ id: dependency, version: this.manifests[extensionId].dependency[dependency] }],
                    requireStack
                };
            }
            if (this._hasRequired(dependency, requireStack)) {
                throw {
                    code: ERROR.CIRCULAR_REQUIREMENT,
                    requireStack
                };
            }
            const targetVersion = this.manifests[extensionId].dependency[dependency];
            if (matchVersion(this.manifests[dependency].version, targetVersion)) {
                graph.addEdge(dependency, extensionId);
                this._checkExtensionLoadingOrderById(dependency, requireStack, graph);
            }
            else {
                throw {
                    code: ERROR.UNAVAILABLE_EXTENSION,
                    extension: [{ id: dependency, version: this.manifests[extensionId].dependency[dependency] }],
                    requireStack
                };
            }
        }
        requireStack.pop();
    }

    private addGuiLocale (locale: Record<string, CCX.LocaleMap>) {
        console.error('addGuiLocale() should be registered first.');
    }

    registerAddGuiLocale (func: (locale: Record<string, CCX.LocaleMap>) => void) {
        this.addGuiLocale = func;
    }
}

export {
    Manager
};
