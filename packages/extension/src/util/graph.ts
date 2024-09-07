import clone from './clone';

const ERROR_DUPLICATED_EDGE = 0x90;
const ERROR_NO_TOPO_ORDER = 0x91;
const INF = 0x3f3f3f3f;

interface EdgeData {
    w: number;
    data: unknown;
}

interface NodeData {
    in: number;
    out: number;
}

interface NodeInfo {
    vis: boolean;
    dis: number;
    path: { from: string; to: string }[];
}

class Graph {
    private edge: { [key: string]: { [key: string]: EdgeData } } = {};
    private node: Record<string, NodeData> = {};
    private nodeCount: number = 0;

    addNode (node: string): void {
        if (!this.hasNode(node)) {
            this.node[node] = {in: 0, out: 0};
            this.edge[node] = {};
            ++this.nodeCount;
        }
    }

    hasNode (node: string): boolean {
        return Object.hasOwnProperty.call(this.node, node);
    }

    addEdge (from: string, to: string, w = 0, data?: unknown): void {
        this.addNode(from);
        this.addNode(to);
        if (this.edge[from][to]) throw ERROR_DUPLICATED_EDGE;
        this.edge[from][to] = {w, data};
        ++this.node[from].out;
        ++this.node[to].in;
    }

    dijkstra (from: string, to: string): { from: string; to: string }[] {
        const tmp: { [key: string]: NodeInfo } = {};
        for (const node in this.node) {
            tmp[node] = {
                vis: false,
                dis: Object.hasOwnProperty.call(this.edge[from], node) ?
                    this.edge[from][node].w : INF,
                path: Object.hasOwnProperty.call(this.edge[from], node) ?
                    [{from, to: node}] : []
            };
        }
        tmp[from].dis = 0;
        tmp[from].vis = false;

        let cnt = 1;
        while (cnt !== this.nodeCount) {
            let idx: string | null = null;
            let min = INF;
            for (const node in this.node) {
                if (!tmp[node].vis && tmp[node].dis < min) {
                    min = tmp[node].dis;
                    idx = node;
                }
            }
            if (idx === null) return [];
            tmp[idx].vis = true;
            ++cnt;
            for (const node in this.node) {
                if (!tmp[node].vis && Object.hasOwnProperty.call(this.edge[idx], node) &&
                    (tmp[idx].dis + this.edge[idx][node].w < tmp[node].dis)
                ) {
                    tmp[node].dis = tmp[idx].dis + this.edge[idx][node].w;
                    tmp[node].path = [...tmp[idx].path];
                    tmp[node].path.push({from: idx, to: node});
                }
            }
        }

        return tmp[to].path;
    }

    bfs (from: string, to: string): { from: string; to: string }[] {
        const queue: string[] = [];
        const path: { [key: string]: { from: string; to: string }[] } = {};
        queue.push(from);
        while (queue.length > 0) {
            const cur = queue.shift()!;
            for (const node in this.edge[cur]) {
                if (path[node]) continue;
                path[node] = [...(path[cur] || [])];
                path[node].push({from: cur, to: node});
                queue.push(node);
            }
        }
        return path[to] || [];
    }

    topo (): string[] {
        const queue: string[] = [];
        const res: string[] = [];
        const nodeClone = clone(this.node);
        for (const node in nodeClone) {
            if (nodeClone[node].in === 0) {
                queue.push(node);
            }
        }
        while (queue.length > 0) {
            const cur = queue.shift()!;
            res.push(cur);
            for (const node in this.edge[cur]) {
                --nodeClone[node].in;
                if (nodeClone[node].in === 0) {
                    queue.push(node);
                }
            }
        }
        if (res.length !== this.nodeCount) {
            throw ERROR_NO_TOPO_ORDER;
        }
        return res;
    }
}

export {
    Graph as default,
    ERROR_DUPLICATED_EDGE,
    ERROR_NO_TOPO_ORDER,
    INF
};
