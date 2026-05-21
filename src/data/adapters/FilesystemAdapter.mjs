// src/data/adapters/FilesystemAdapter.mjs

import fs from 'fs/promises';
import path from 'path';

export class FilesystemAdapter {
    constructor(project, options = {}) {
        this.project = project;
        this.root = options.root || project.getRoot();
    }

    resolve(...segments) {
        return path.resolve(this.root, ...segments);
    }

    async exists(filePath) {
        try {
            await fs.access(this.resolve(filePath));
            return true;
        } catch {
            return false;
        }
    }

    async readText(filePath, encoding = 'utf8') {
        return fs.readFile(this.resolve(filePath), encoding);
    }

    async readJson(filePath) {
        const content = await this.readText(filePath);
        return JSON.parse(content);
    }

    async writeText(filePath, content, encoding = 'utf8') {
        const absolutePath = this.resolve(filePath);
        await fs.mkdir(path.dirname(absolutePath), { recursive: true });
        await fs.writeFile(absolutePath, content, encoding);
    }

    async ensureDir(dirPath) {
        await fs.mkdir(this.resolve(dirPath), { recursive: true });
    }

    async remove(targetPath) {
        await fs.rm(this.resolve(targetPath), {
            recursive: true,
            force: true
        });
    }

    async copy(from, to) {
        const sourcePath = this.resolve(from);
        const targetPath = this.resolve(to);

        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        await fs.cp(sourcePath, targetPath, { recursive: true });
    }
}