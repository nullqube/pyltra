//
// In the name of God
//
// ============================================================
// FilesystemAdapter
// ============================================================
//
// Canonical v2 filesystem adapter for Pyltra.
//
// Responsibilities:
// - filesystem abstraction
// - safe file operations
// - path resolution
// - directory utilities
// - copy/remove helpers
// - glob discovery
//
// Non-responsibilities:
// - parsing markdown
// - loading pages
// - loading collections
// - rendering
// - config ownership
// - route generation
//
// The adapter exposes RAW filesystem capabilities only.
//
// ============================================================

import fs from 'fs/promises';
import path from 'path';

import fastGlob from 'fast-glob';

function toPosixPath(value) {
    return value.replaceAll(path.sep, '/');
}

function ensureArray(value) {
    return Array.isArray(value) ? value : [value];
}

export class FilesystemAdapter {
  encoding: any;
  project: any;
  root: any;

    // ========================================================
    // Constructor
    // ========================================================

    constructor(project, options: any = {}) {
        if (!project) {
            throw new Error('FilesystemAdapter requires a project instance.');
        }

        this.project = project;

        this.root =
            options.root ||
            project.getRoot();

        this.encoding =
            options.encoding ||
            'utf8';
    }

    // ========================================================
    // Base Paths
    // ========================================================

    getRoot() {
        return this.root;
    }

    resolve(...segments) {
        return path.resolve(this.root, ...segments);
    }

    relative(targetPath) {
        return toPosixPath(
            path.relative(this.root, targetPath)
        );
    }

    join(...segments) {
        return toPosixPath(
            path.join(...segments)
        );
    }

    normalize(targetPath) {
        return toPosixPath(
            path.normalize(targetPath)
        );
    }

    isAbsolute(targetPath) {
        return path.isAbsolute(targetPath);
    }

    resolvePath(targetPath) {
        return this.isAbsolute(targetPath)
            ? targetPath
            : this.resolve(targetPath);
    }

    // ========================================================
    // Existence
    // ========================================================

    async exists(targetPath) {
        try {
            await fs.access(
                this.resolvePath(targetPath)
            );

            return true;
        }
        catch {
            return false;
        }
    }

    // ========================================================
    // Stat
    // ========================================================

    async stat(targetPath) {
        return fs.stat(
            this.resolvePath(targetPath)
        );
    }

    async isFile(targetPath) {
        try {
            const stats = await this.stat(targetPath);

            return stats.isFile();
        }
        catch {
            return false;
        }
    }

    async isDirectory(targetPath) {
        try {
            const stats = await this.stat(targetPath);

            return stats.isDirectory();
        }
        catch {
            return false;
        }
    }

    // ========================================================
    // Read
    // ========================================================

    async readText(targetPath, encoding = this.encoding) {
        return fs.readFile(
            this.resolvePath(targetPath),
            encoding
        );
    }

    async readBuffer(targetPath) {
        return fs.readFile(
            this.resolvePath(targetPath)
        );
    }

    async readJson(targetPath, options: any = {}) {
        const encoding =
            options.encoding ||
            this.encoding;

        const content = await this.readText(
            targetPath,
            encoding
        );

        return JSON.parse(content as any);
    }

    async readDirectory(targetPath = '.', options: any = {}) {
        return fs.readdir(
            this.resolvePath(targetPath),
            {
                withFileTypes:
                    options.withFileTypes ?? false
            }
        );
    }

    // ========================================================
    // Write
    // ========================================================

    async writeText(
        targetPath,
        content,
        options: any = {}
    ) {
        const absolutePath =
            this.resolvePath(targetPath);

        const encoding =
            options.encoding ||
            this.encoding;

        await this.ensureDirectory(
            path.dirname(absolutePath)
        );

        await fs.writeFile(
            absolutePath,
            content,
            encoding
        );
    }

    async writeJson(
        targetPath,
        data,
        options: any = {}
    ) {
        const spaces =
            options.spaces ?? 4;

        const content = JSON.stringify(
            data,
            null,
            spaces
        );

        await this.writeText(
            targetPath,
            content,
            options
        );
    }

    async appendText(
        targetPath,
        content,
        options: any = {}
    ) {
        const absolutePath =
            this.resolvePath(targetPath);

        const encoding =
            options.encoding ||
            this.encoding;

        await this.ensureDirectory(
            path.dirname(absolutePath)
        );

        await fs.appendFile(
            absolutePath,
            content,
            encoding
        );
    }

    // ========================================================
    // Directory
    // ========================================================

    async ensureDirectory(targetPath) {
        await fs.mkdir(
            this.resolvePath(targetPath),
            {
                recursive: true
            }
        );
    }

    async emptyDirectory(targetPath) {
        const absolutePath =
            this.resolvePath(targetPath);

        await fs.rm(absolutePath, {
            recursive: true,
            force: true
        });

        await fs.mkdir(absolutePath, {
            recursive: true
        });
    }

    // ========================================================
    // Remove
    // ========================================================

    async remove(targetPath) {
        await fs.rm(
            this.resolvePath(targetPath),
            {
                recursive: true,
                force: true
            }
        );
    }

    // ========================================================
    // Move / Copy
    // ========================================================

    async copy(from, to, options: any = {}) {
        const sourcePath =
            this.resolvePath(from);

        const targetPath =
            this.resolvePath(to);

        await this.ensureDirectory(
            path.dirname(targetPath)
        );

        await fs.cp(
            sourcePath,
            targetPath,
            {
                recursive:
                    options.recursive ?? true,

                force:
                    options.force ?? true
            }
        );
    }

    async move(from, to) {
        const sourcePath =
            this.resolvePath(from);

        const targetPath =
            this.resolvePath(to);

        await this.ensureDirectory(
            path.dirname(targetPath)
        );

        await fs.rename(
            sourcePath,
            targetPath
        );
    }

    // ========================================================
    // Discovery
    // ========================================================

    async glob(patterns, options: any = {}) {
        const normalizedPatterns =
            ensureArray(patterns);

        const entries = await fastGlob(
            normalizedPatterns,
            {
                cwd:
                    options.cwd ||
                    this.root,

                absolute:
                    options.absolute ?? false,

                onlyFiles:
                    options.onlyFiles ?? true,

                onlyDirectories:
                    options.onlyDirectories ?? false,

                dot:
                    options.dot ?? false,

                deep:
                    options.deep ?? true,

                unique:
                    options.unique ?? true,

                ignore:
                    options.ignore || []
            }
        );

        return entries.map(entry =>
            toPosixPath(entry)
        );
    }

    // ========================================================
    // Metadata
    // ========================================================

    async getModifiedTime(targetPath) {
        const stats = await this.stat(targetPath);

        return stats.mtime;
    }

    async getCreatedTime(targetPath) {
        const stats = await this.stat(targetPath);

        return stats.birthtime;
    }

    async getSize(targetPath) {
        const stats = await this.stat(targetPath);

        return stats.size;
    }

    // ========================================================
    // Utility
    // ========================================================

    async touch(targetPath) {
        const absolutePath =
            this.resolvePath(targetPath);

        const now = new Date();

        if (await this.exists(absolutePath)) {
            await fs.utimes(
                absolutePath,
                now,
                now
            );

            return;
        }

        await this.writeText(
            absolutePath,
            ''
        );
    }

    async ensureFile(
        targetPath,
        defaultContent = ''
    ) {
        if (await this.exists(targetPath)) {
            return;
        }

        await this.writeText(
            targetPath,
            defaultContent
        );
    }

    // ========================================================
    // Debug
    // ========================================================

    toJSON() {
        return {
            type: 'FilesystemAdapter',
            root: this.root
        };
    }
}