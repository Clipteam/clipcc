#!/usr/bin/env node

/**
 * @fileoverview
 * Generate a squashed patch from upstream repo's commit range
 * and convert it to monorepo-acceptable format.
 */

import { execSync } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT_DIR = join(__dirname, '..');
const UPSTREAM_DIR = join(ROOT_DIR, 'upstream-llk');
const MIGRATION_DIR = join(ROOT_DIR, '.migration');

// Mapping from scratch-* package names to local package names
const PACKAGE_MAP = {
    'scratch-gui': 'gui',
    'scratch-render': 'render',
    'scratch-svg-renderer': 'svg-renderer',
    'scratch-vm': 'vm',
    'scratch-audio': 'audio',
    'scratch-blocks': 'block',
    'scratch-l10n': 'l10n',
    'scratch-paint': 'paint',
    'scratch-parser': 'parser',
    'scratch-storage': 'storage',
};

function run(command, options = {}) {
    console.log(`> ${command}`);
    return execSync(command, { encoding: 'utf-8', ...options });
}

function runSilent(command, options = {}) {
    return execSync(command, { encoding: 'utf-8', ...options });
}

function processPatch(patchContent) {
    const diffs = patchContent.split('diff --git ');
    const header = diffs[0];
    diffs.shift();

    for (let i = 0; i < diffs.length; i++) {
        const endIndex = diffs[i].indexOf('@@');
        let diffMeta;
        let diffContent = '';
        
        if (endIndex !== -1) {
            diffMeta = diffs[i].substring(0, endIndex - 1).split('\n');
            diffContent = diffs[i].substring(endIndex);
        } else {
            diffMeta = diffs[i].split('\n');
        }

        for (let j = 0; j < diffMeta.length; j++) {
            // process file path in first line (e.g., "a/packages/scratch-gui/src/..." "b/packages/scratch-gui/src/...")
            if (j === 0) {
                let [from, to] = diffMeta[0].split(' ');
                from = rewritePath(from, 'a');
                to = rewritePath(to, 'b');
                diffMeta[0] = `${from} ${to}`;
                continue;
            }
            // process --- and +++ lines
            if (diffMeta[j].startsWith('+++') || diffMeta[j].startsWith('---')) {
                const prefix = diffMeta[j].slice(0, 4);
                const filePath = diffMeta[j].substring(4);
                // it's a new file or deleted file
                if (filePath === '/dev/null') continue;
                const rewritten = rewritePath(filePath, filePath.startsWith('a/') ? 'a' : 'b');
                diffMeta[j] = `${prefix}${rewritten}`;
            }
            // process rename from/to lines
            if (diffMeta[j].startsWith('rename from ') || diffMeta[j].startsWith('rename to ')) {
                const prefix = diffMeta[j].startsWith('rename from ') ? 'rename from ' : 'rename to ';
                const filePath = diffMeta[j].substring(prefix.length);
                const rewritten = rewritePath(filePath, '').substring(1); // remove leading /
                diffMeta[j] = `${prefix}${rewritten}`;
            }
        }

        diffMeta = diffMeta.join('\n');
        if (endIndex !== -1) {
            diffs[i] = `diff --git ${diffMeta}\n${diffContent}`;
        } else {
            diffs[i] = `diff --git ${diffMeta}`;
        }
    }

    return `${header}${diffs.join('')}`;
}

function rewritePath(filePath, prefix) {
    // Match patterns like "a/packages/scratch-xxx/..." or "b/packages/scratch-xxx/..."
    const match = filePath.match(/^[ab]\/packages\/scratch-([^/]+)\/(.*)$/);
    if (match) {
        const scratchPackageName = `scratch-${match[1]}`;
        const restPath = match[2];
        const localPackageName = PACKAGE_MAP[scratchPackageName];
        if (localPackageName) {
            return `${prefix}/packages/${localPackageName}/${restPath}`;
        }
        // If no mapping found, keep original package name without scratch- prefix
        return `${prefix}/packages/${match[1]}/${restPath}`;
    }
    
    // Handle paths without a/ or b/ prefix (for rename from/to)
    const matchNoPrefix = filePath.match(/^packages\/scratch-([^/]+)\/(.*)$/);
    if (matchNoPrefix) {
        const scratchPackageName = `scratch-${matchNoPrefix[1]}`;
        const restPath = matchNoPrefix[2];
        const localPackageName = PACKAGE_MAP[scratchPackageName];
        if (localPackageName) {
            return `${prefix}/packages/${localPackageName}/${restPath}`;
        }
        return `${prefix}/packages/${matchNoPrefix[1]}/${restPath}`;
    }

    return filePath;
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Usage: yarn run patch:generate <commit-range>');
        console.log('Example: yarn run patch:generate HEAD~5..HEAD');
        console.log('Example: yarn run patch:generate abc123..def456');
        process.exit(1);
    }

    const commitRange = args[0];

    // Check if upstream directory exists
    if (!existsSync(UPSTREAM_DIR)) {
        console.error('Upstream directory does not exist. Use yarn run upstream:pull first');
        process.exit(1);
    }

    // Check if upstream is a git repository
    if (!existsSync(join(UPSTREAM_DIR, '.git'))) {
        console.error('Upstream directory is not a git repository. Use yarn run upstream:pull first');
        process.exit(1);
    }

    // Create .migration directory if it doesn't exist
    if (!existsSync(MIGRATION_DIR)) {
        mkdirSync(MIGRATION_DIR, { recursive: true });
        console.log('Created .migration directory');
    }

    // Get current branch in upstream BEFORE any operations
    let originalBranch;
    try {
        originalBranch = runSilent('git rev-parse --abbrev-ref HEAD', { cwd: UPSTREAM_DIR }).trim();
    } catch (e) {
        // If in detached HEAD state, get the commit hash instead
        originalBranch = runSilent('git rev-parse HEAD', { cwd: UPSTREAM_DIR }).trim();
    }
    console.log(`Current upstream branch: ${originalBranch}`);

    const tmpBranch = `tmp-patch-${Date.now()}`;

    try {
        // Parse commit range to get start and end commits
        const [startCommit, endCommit] = commitRange.includes('..')
            ? commitRange.split('..')
            : [commitRange + '^', commitRange];

        // Get the base commit (parent of start commit for rebase)
        const baseCommit = runSilent(`git rev-parse ${startCommit}`, { cwd: UPSTREAM_DIR }).trim();
        const targetCommit = runSilent(`git rev-parse ${endCommit}`, { cwd: UPSTREAM_DIR }).trim();

        console.log(`Base commit: ${baseCommit}`);
        console.log(`Target commit: ${targetCommit}`);

        // Create temporary branch at the target commit
        run(`git checkout -b ${tmpBranch} ${targetCommit}`, { cwd: UPSTREAM_DIR });

        // Soft reset to base commit to squash all changes
        run(`git reset --soft ${baseCommit}`, { cwd: UPSTREAM_DIR });

        // Create a single squashed commit
        const commitMessage = `Squashed changes from ${commitRange}`;
        run(`git commit -m "${commitMessage}"`, { cwd: UPSTREAM_DIR });

        // Generate output filename
        const sanitizedRange = commitRange.replace(/[^a-zA-Z0-9._-]/g, '_');
        const tmpPatchFile = join(MIGRATION_DIR, `tmp_${sanitizedRange}.patch`);
        const outputFile = join(MIGRATION_DIR, `${sanitizedRange}.patch`);

        // Generate patch from the squashed commit directly to file
        run(`git format-patch -1 --stdout > "${tmpPatchFile}"`, { cwd: UPSTREAM_DIR, shell: true });

        // Read, process, and write the patch
        const patchContent = readFileSync(tmpPatchFile, 'utf-8');
        const processedPatch = processPatch(patchContent);
        writeFileSync(outputFile, processedPatch);

        // Remove temporary patch file
        try {
            unlinkSync(tmpPatchFile);
        } catch (e) {
            // Ignore cleanup errors
        }

        console.log(`\nPatch generated: ${outputFile}`);

    } catch (error) {
        console.error('Error generating patch:', error.message);
        process.exit(1);
    } finally {
        // Cleanup: switch back to original branch and delete tmp branch
        try {
            run(`git checkout ${originalBranch}`, { cwd: UPSTREAM_DIR });
            run(`git branch -D ${tmpBranch}`, { cwd: UPSTREAM_DIR });
        } catch (cleanupError) {
            console.error('Warning: Failed to cleanup temporary branch:', cleanupError.message);
        }
    }
}

main();
