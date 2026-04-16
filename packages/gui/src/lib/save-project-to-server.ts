import queryString from 'query-string';
import xhr, {type XhrUrlConfig} from 'xhr';
import storage from '../lib/storage';
import type VM from 'clipcc-vm';
import type {CamelToSnakeKeys} from './type-traits';

type ProjectJSON = ReturnType<VM['toJSON']>;

/**
 * the request params.
 */
interface Param {
    /** The original project ID if a copy/remix */
    originalId?: number;
    /** A flag indicating if this save is creating a copy */
    isCopy?: boolean;
    /** A flag indicating if this save is creating a remix */
    isRemix?: boolean;
    /** The title of the project */
    title?: string;
}

/**
 * Save a project JSON to the project server.
 * This should eventually live in scratch-www.
 * @param projectId the ID of the project, null if a new project.
 * @param vmState the JSON project representation.
 * @param params the request params.
 * @returns A promise that resolves when the network request resolves.
 */
export default function (projectId: number | null, vmState: ProjectJSON, params: Param): Promise<{id: number}> {
    const creatingProject = projectId === null || typeof projectId === 'undefined';
    const queryParams: CamelToSnakeKeys<Param> = {};
    if (Object.prototype.hasOwnProperty.call(params, 'originalId')) queryParams.original_id = params.originalId;
    if (Object.prototype.hasOwnProperty.call(params, 'isCopy')) queryParams.is_copy = params.isCopy;
    if (Object.prototype.hasOwnProperty.call(params, 'isRemix')) queryParams.is_remix = params.isRemix;
    if (Object.prototype.hasOwnProperty.call(params, 'title')) queryParams.title = params.title;
    let qs = queryString.stringify(queryParams);
    if (qs) qs = `?${qs}`;

    const opts = Object.assign({
        body: vmState,
        // If we set json:true then the body is double-stringified, so don't
        headers: {
            'Content-Type': 'application/json'
        },
        withCredentials: true
    }, creatingProject ? {
        method: 'post',
        url: `${storage.projectHost}/${qs}`
    } : {
        method: 'put',
        url: `${storage.projectHost}/${projectId}${qs}`
    }) as XhrUrlConfig;
    return new Promise((resolve, reject) => {
        xhr(opts, (err, response) => {
            if (err) return reject(err);
            if (response.statusCode !== 200) return reject(response.statusCode);
            let body;
            try {
                // Since we didn't set json: true, we have to parse manually
                body = JSON.parse(response.body as string);
            } catch (e) {
                return reject(e);
            }
            body.id = projectId;
            if (creatingProject) {
                body.id = body['content-name'];
            }
            resolve(body);
        });
    });
}
