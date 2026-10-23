import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../', import.meta.url));
let workdir: string;
let packageDir: string;
let cli: string;

function runCli(args: string[], cwd: string) {
    return execFileSync(process.execPath, [cli, ...args], {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, PYLTRA_ROOT: '' },
    });
}

describe('published CLI bundle', () => {
    beforeAll(() => {
        workdir = mkdtempSync(path.join(tmpdir(), 'pyltra-package-'));
        execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: root });
        // Exercise the actual npm artifact outside the checkout, without publishing.
        const packed = JSON.parse(execFileSync('npm', [
            'pack', '--ignore-scripts', '--json', '--pack-destination', workdir,
        ], {
            cwd: root,
            encoding: 'utf8',
            env: { ...process.env, npm_config_cache: path.join(workdir, 'npm-cache') },
        }))[0];
        execFileSync('tar', ['-xzf', path.join(workdir, packed.filename), '-C', workdir]);
        packageDir = path.join(workdir, 'package');
        cli = path.join(packageDir, 'dist', 'cli.js');
        // Reuse installed dependencies; no source files are linked into the artifact.
        symlinkSync(path.join(root, 'node_modules'), path.join(packageDir, 'node_modules'), 'dir');
    }, 30000);

    afterAll(() => {
        if (workdir) rmSync(workdir, { recursive: true, force: true });
    });

    it('ships one executable JavaScript file and templates without duplicate copies', () => {
        expect(readdirSync(path.join(packageDir, 'dist')).sort()).toEqual(['cli.js', 'templates']);
        expect(readdirSync(packageDir)).not.toContain('templates');
        expect(readFileSync(cli, 'utf8')).toMatch(/^#!\/usr\/bin\/env node\n/);
        expect(statSync(cli).mode & 0o111).toBeTruthy();
        const pkg = JSON.parse(readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
        expect(pkg.bin.pyltra).toBe('./dist/cli.js');
        expect(pkg.dependencies.esbuild).toBeTruthy();
        expect(pkg.dependencies['fast-glob']).toBeTruthy();
        expect(runCli(['--version'], workdir).trim()).toBe(pkg.version);
        expect(runCli(['--help'], workdir)).toContain('Initialize a new Pyltra project');
    });

    it.each(['basic', 'ember-gate'])('scaffolds and builds the packaged %s template', template => {
        runCli(['init', template, '--template', template], workdir);
        const site = path.join(workdir, template);
        mkdirSync(path.join(site, 'src/assets/scss'), { recursive: true });
        writeFileSync(path.join(site, 'src/assets/scss/bundle-check.scss'), '$color: red; .bundle-check { color: $color; }');
        writeFileSync(path.join(site, 'src/assets/js/bundle-check.js'), 'const value = 1 + 2; console.log(value);');
        runCli(['--env', 'production', 'build'], site);
        expect(readFileSync(path.join(site, 'dist/en/index.html'), 'utf8')).toContain('<html');
        expect(readFileSync(path.join(site, 'dist/assets/css/bundle-check.css'), 'utf8')).toContain('.bundle-check{color:red}');
        expect(readFileSync(path.join(site, 'dist/assets/js/bundle-check.js'), 'utf8')).toContain('console.log');
    });
});
