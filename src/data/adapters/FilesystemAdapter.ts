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

import type { Project } from '../../project/Project.ts';

function toPosixPath(value: string): string {
    return value.replaceAll(path.sep, '/');
}

function ensureArray(value: string | string[]): string[] {
    return Array.isArray(value) ? value : [value];
}

export interface FilesystemAdapterOptions {
    root?: string;
    encoding?: BufferEncoding;
}

interface EncodingOptions {
    encoding?: BufferEncoding;
}

export class FilesystemAdapter {
  encoding: BufferEncoding;
  project: Project;
  root: string;

    // ========================================================
    // Constructor
    // ========================================================

    constructor(project: Project, options: FilesystemAdapterOptions = {}) {
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

    resolve(...segments: string[]) {
        return path.resolve(this.root, ...segments);
    }

    relative(targetPath: string) {
        return toPosixPath(
            path.relative(this.root, targetPath)
        );
    }

    join(...segments: string[]) {
        return toPosixPath(
            path.join(...segments)
        );
    }

    normalize(targetPath: string) {
        return toPosixPath(
            path.normalize(targetPath)
        );
    }

    isAbsolute(targetPath: string) {
        return path.isAbsolute(targetPath);
    }

    resolvePath(targetPath: string) {
        return this.isAbsolute(targetPath)
            ? targetPath
            : this.resolve(targetPath);
    }

    // ========================================================
    // Existence
    // ========================================================

    async exists(targetPath: string) {
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

    async stat(targetPath: string) {
        return fs.stat(
            this.resolvePath(targetPath)
        );
    }

    async isFile(targetPath: string) {
        try {
            const stats = await this.stat(targetPath);

            return stats.isFile();
        }
        catch {
            return false;
        }
    }

    async isDirectory(targetPath: string) {
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

    async readText(targetPath: string, encoding: BufferEncoding = this.encoding) {
        return fs.readFile(
            this.resolvePath(targetPath),
            encoding
        );
    }

    async readBuffer(targetPath: string) {
        return fs.readFile(
            this.resolvePath(targetPath)
        );
    }

    async readJson(targetPath: string, options: EncodingOptions = {}) {
        const encoding =
            options.encoding ||
            this.encoding;

        const content = await this.readText(
            targetPath,
            encoding
        );

        return JSON.parse(content);
    }

    async readDirectory(targetPath: string = '.', options: { withFileTypes?: boolean } = {}) {
        return fs.readdir(
            this.resolvePath(targetPath),
            {
                withFileTypes:
                    options.withFileTypes ?? false
            // `withFileTypes` is a dynamic boolean here; cast to match the
            // string[]-returning readdir overload.
            } as { withFileTypes: false }
        );
    }

    // ========================================================
    // Write
    // ========================================================

    async writeText(
        targetPath: string,
        content: string,
        options: EncodingOptions = {}
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
        targetPath: string,
        data: unknown,
        options: { spaces?: number; encoding?: BufferEncoding } = {}
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
        targetPath: string,
        content: string,
        options: EncodingOptions = {}
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

    async ensureDirectory(targetPath: string) {
        await fs.mkdir(
            this.resolvePath(targetPath),
            {
                recursive: true
            }
        );
    }

    async emptyDirectory(targetPath: string) {
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

    async remove(targetPath: string) {
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

    async copy(from: string, to: string, options: { recursive?: boolean; force?: boolean } = {}) {
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

    async move(from: string, to: string) {
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

    async glob(
        patterns: string | string[],
        options: {
            cwd?: string;
            absolute?: boolean;
            onlyFiles?: boolean;
            onlyDirectories?: boolean;
            dot?: boolean;
            deep?: boolean;
            unique?: boolean;
            ignore?: string[];
        } = {}
    ) {
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
            // fast-glob types `deep` as a number, but the existing default is a
            // boolean; cast the options bag through unknown to preserve behavior.
            } as unknown as fastGlob.Options
        );

        return entries.map(entry =>
            toPosixPath(entry)
        );
    }

    // ========================================================
    // Metadata
    // ========================================================

    async getModifiedTime(targetPath: string) {
        const stats = await this.stat(targetPath);

        return stats.mtime;
    }

    async getCreatedTime(targetPath: string) {
        const stats = await this.stat(targetPath);

        return stats.birthtime;
    }

    async getSize(targetPath: string) {
        const stats = await this.stat(targetPath);

        return stats.size;
    }

    // ========================================================
    // Utility
    // ========================================================

    async touch(targetPath: string) {
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
        targetPath: string,
        defaultContent: string = ''
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