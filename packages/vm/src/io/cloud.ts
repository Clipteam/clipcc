import Variable from '../engine/variable';
import log from '../util/log';
import type Runtime from '../engine/runtime';
import type Target from '../engine/target';

interface VarUpdateData {
    /** The name of the variable to update */
    name: string;
    /** The scalar value to update the variable with */
    value: string | number;
}

interface CloudIOData {
    /** A VarUpdateData message indicating a cloud variable update */
    varUpdate?: VarUpdateData;
}

export interface CloudProvider {
    /** A function which sends a cloud variable update to the cloud data server. */
    updateVariable: (name: string, value: string | number) => void;
    /** A function which closes the connection to the cloud data server. */
    requestCloseConnection: () => void;
    createVariable: (name: string, value: unknown) => void;
    renameVariable: (oldName: string, newName: string) => void;
    deleteVariable: (name: string) => void;
}

class Cloud {
    /**
     * Reference to the cloud data provider, responsible for mananging
     * the web socket connection to the cloud data server.
     */
    provider: CloudProvider | null = null;

    /**
     * Reference to the runtime that owns this cloud io device.
     */
    runtime: Runtime;

    /**
     * Reference to the stage target which owns the cloud variables
     * in the project.
     */
    stage: Target | null = null;

    /**
     * Cloud IO Device responsible for sending and receiving messages from
     * cloud provider (mananging the cloud server connection) and interacting
     * with cloud variables in the current project.
     * @param runtime The runtime context for this cloud io device.
     */
    constructor (runtime: Runtime) {
        this.runtime = runtime;
    }

    /**
     * Set a reference to the cloud data provider.
     * @param provider The cloud data provider
     */
    setProvider (provider: CloudProvider) {
        this.provider = provider;
    }

    /**
     * Set a reference to the stage target which owns the
     * cloud variables in the project.
     * @param stage The stage target
     */
    setStage (stage: Target) {
        this.stage = stage;
    }

    /**
     * Handle incoming data to this io device.
     * @param data The CloudIOData object to process
     */
    postData (data: CloudIOData) {
        if (data.varUpdate) {
            this.updateCloudVariable(data.varUpdate);
        }
    }

    requestCreateVariable (variable: Variable) {
        if (this.runtime.canAddCloudVariable()) {
            if (this.provider) {
                this.provider.createVariable(variable.name, variable.value);
                // We'll set the cloud flag and update the
                // cloud variable limit when we actually
                // get a confirmation from the cloud data server
            }
        } // TODO else track creation for later
    }

    /**
     * Request the cloud data provider to update the given variable with
     * the given value. Does nothing if this io device does not have a provider set.
     * @param name The name of the variable to update
     * @param value The value to update the variable with
     */
    requestUpdateVariable (name: string, value: string | number) {
        if (this.provider) {
            this.provider.updateVariable(name, value);
        }
    }

    /**
     * Request the cloud data provider to rename the variable with the given name
     * to the given new name. Does nothing if this io device does not have a provider set.
     * @param oldName The name of the variable to rename
     * @param newName The new name for the variable
     */
    requestRenameVariable (oldName: string, newName: string) {
        if (this.provider) {
            this.provider.renameVariable(oldName, newName);
        }
    }

    /**
     * Request the cloud data provider to delete the variable with the given name
     * Does nothing if this io device does not have a provider set.
     * @param name The name of the variable to delete
     */
    requestDeleteVariable (name: string) {
        if (this.provider) {
            this.provider.deleteVariable(name);
        }
    }

    /**
     * Update a cloud variable in the runtime based on the message received
     * from the cloud provider.
     * @param varUpdate A VarUpdateData object describing
     * a cloud variable update received from the cloud data provider.
     */
    updateCloudVariable (varUpdate: VarUpdateData) {
        const varName = varUpdate.name;

        const variable = this.stage!.lookupVariableByNameAndType(varName, Variable.SCALAR_TYPE);
        if (!variable || !variable.isCloud) {
            log.warn(`Received an update for a cloud variable that does not exist: ${varName}`);
            return;
        }

        variable.value = varUpdate.value;
    }

    /**
     * Request the cloud data provider to close the web socket connection and
     * clear this io device of references to the cloud data provider and the
     * stage.
     */
    clear () {
        if (!this.provider) return;

        this.provider.requestCloseConnection();
        this.provider = null;
        this.stage = null;
    }
}

export default Cloud;
