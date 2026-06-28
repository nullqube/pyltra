/**
 * AssetPipeline
 * -------------
 * Processes assets.
 *
 * This simplified version copies assets.
 * You can reintroduce:
 * - SCSS compile
 * - Minify
 * - Image optimization
 */

import fs from 'fs';
import path from 'path';

import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import * as esbuild from 'esbuild';
import fastGlob from 'fast-glob';
import postcss from 'postcss';
import * as sass from 'sass';
import sharp from 'sharp';
import { optimize } from 'svgo';

import { RuntimeAware } from '../../core/runtime/RuntimeAware.mjs';
import { BuildArtifact } from '../../core/diagnostics/BuildArtifact.mjs';
export class AssetPipeline extends RuntimeAware {

    constructor(runtime, project) {
        super({ runtime });
        this.project = project;
    }

    async processAll() {
        await this.compileScss();
        await this.copyAssets();
        await this.writeCssSourcemaps();
        await this.minifyCss();
        await this.minifyJs();
        await this.optimizeImages();
        await this.optimizeSvgs();
    }

    async compileScss() {
        const scssRoot = path.join(this.project.getSourcePath(), 'assets', 'scss');
        const cssRoot = path.join(this.project.getDistPath(), 'assets', 'css');

        if (!fs.existsSync(scssRoot)) return;

        const files = await fastGlob('**/*.scss', {
            cwd: scssRoot,
            onlyFiles: true,
            ignore: ['**/_*.scss']
        });

        await Promise.all(files.map(async file => {
            const sourcePath = path.join(scssRoot, file);
            const outputPath = path.join(
                cssRoot,
                file.replace(/\.scss$/i, '.css')
            );
            const result = sass.compile(sourcePath, {
                style: this.isProduction ? 'compressed' : 'expanded',
                sourceMap: !this.isProduction,
                sourceMapIncludeSources: !this.isProduction
            });
            const processed = await postcss([autoprefixer()]).process(result.css, {
                from: sourcePath,
                to: outputPath,
                map: this.isProduction
                    ? false
                    : {
                        prev: result.sourceMap,
                        inline: false,
                        annotation: `${path.basename(outputPath)}.map`
                    }
            });

            this.diagnostics.recordArtifact(new BuildArtifact({
                type: 'style',
                lang: null,
                name: file,
                size: Buffer.byteLength(processed.css, 'utf-8'),
                createdBy: 'AssetPipeline'
            }));
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, processed.css);
            if (processed.map) {
                fs.writeFileSync(`${outputPath}.map`, processed.map.toString());
            }
        }));
    }

    async copyAssets() {
        const srcAssets = path.join(this.project.getSourcePath(), 'assets');
        const distAssets = path.join(this.project.getDistPath(), 'assets');

        if (!fs.existsSync(srcAssets)) return;

        const files = await fastGlob('**/*', {
            cwd: srcAssets,
            onlyFiles: true,
            dot: true,
            ignore: ['**/scss/**']
        });

        await Promise.all(files.map(async file => {
            const sourcePath = path.join(srcAssets, file);
            const outputPath = path.join(distAssets, file);

            this.diagnostics.recordArtifact(new BuildArtifact({
                type: this.#getCopiedAssetType(file),
                lang: null,
                name: file,
                size: fs.statSync(sourcePath).size,
                createdBy: 'AssetPipeline'
            }));

            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.copyFileSync(sourcePath, outputPath);
        }));
    }

    #getCopiedAssetType(file) {
        const extension = path.extname(file).toLowerCase();

        if (extension === '.css') return 'style';
        if (extension === '.js') return 'script';
        if (['.avif', '.gif', '.ico', '.jpeg', '.jpg', '.png', '.svg', '.webp'].includes(extension)) return 'image';

        return 'asset';
    }

    async minifyCss() {
        if (!this.isProduction) return;

        const cssRoot = path.join(this.project.getDistPath(), 'assets', 'css');

        if (!fs.existsSync(cssRoot)) return;

        const files = await fastGlob('**/*.css', {
            cwd: cssRoot,
            onlyFiles: true
        });

        await Promise.all(files.map(async file => {
            const filePath = path.join(cssRoot, file);
            const result = await postcss([cssnano()]).process(
                fs.readFileSync(filePath, 'utf8'),
                {
                    from: filePath,
                    to: filePath,
                    map: false
                }
            );

            this.diagnostics.recordArtifact(new BuildArtifact({
                type: 'style',
                lang: null,
                name: file,
                size: Buffer.byteLength(result.css, 'utf-8'),
                createdBy: 'AssetPipeline'
            }));
            fs.writeFileSync(filePath, result.css);
        }));
    }

    async writeCssSourcemaps() {
        if (this.isProduction) return;

        const cssRoot = path.join(this.project.getDistPath(), 'assets', 'css');

        if (!fs.existsSync(cssRoot)) return;

        const files = await fastGlob('**/*.css', {
            cwd: cssRoot,
            onlyFiles: true
        });

        await Promise.all(files.map(async file => {
            const filePath = path.join(cssRoot, file);
            if (!fs.existsSync(filePath)) return;
            if (fs.existsSync(`${filePath}.map`)) return;

            const result = await postcss([]).process(
                fs.readFileSync(filePath, 'utf8'),
                {
                    from: filePath,
                    to: filePath,
                    map: {
                        inline: false,
                        annotation: `${path.basename(filePath)}.map`
                    }
                }
            );

            fs.writeFileSync(filePath, result.css);
            if (result.map) {
                fs.writeFileSync(`${filePath}.map`, result.map.toString());
            }
        }));
    }

    async minifyJs() {
        if (!this.isProduction) return;

        const jsRoot = path.join(this.project.getDistPath(), 'assets', 'js');

        if (!fs.existsSync(jsRoot)) return;

        const files = await fastGlob('**/*.js', {
            cwd: jsRoot,
            onlyFiles: true
        });

        await Promise.all(files.map(async file => {
            const filePath = path.join(jsRoot, file);
            const result = await esbuild.transform(
                fs.readFileSync(filePath, 'utf8'),
                {
                    loader: 'js',
                    minify: true,
                    sourcemap: false,
                    target: 'es2018'
                }
            );

            this.diagnostics.recordArtifact(new BuildArtifact({
                type: 'script',
                lang: null,
                name: file,
                size: Buffer.byteLength(result.code, 'utf-8'),
                createdBy: 'AssetPipeline'
            }));
            fs.writeFileSync(filePath, result.code.trim());
        }));
    }

    async optimizeImages() {
        const imgRoot = path.join(this.project.getSourcePath(), 'assets', 'img');
        const distImgRoot = path.join(this.project.getDistPath(), 'assets', 'img');

        if (!fs.existsSync(imgRoot)) return;

        const files = await fastGlob('**/*.{jpg,jpeg,png,webp,avif}', {
            cwd: imgRoot,
            onlyFiles: true,
            caseSensitiveMatch: false
        });

        await Promise.all(files.map(async file => {
            const sourcePath = path.join(imgRoot, file);
            const outputPath = path.join(distImgRoot, file);
            const extension = path.extname(file).toLowerCase();
            let pipeline = sharp(sourcePath);

            if (extension === '.jpg' || extension === '.jpeg') {
                pipeline = pipeline.jpeg({ quality: 75, progressive: true });
            } else if (extension === '.png') {
                pipeline = pipeline.png({ compressionLevel: 9, palette: true });
            } else if (extension === '.webp') {
                pipeline = pipeline.webp({ quality: 75 });
            } else if (extension === '.avif') {
                pipeline = pipeline.avif({ quality: 50 });
            }

            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            await pipeline.toFile(outputPath);
        }));
    }

    async optimizeSvgs() {
        const imgRoot = path.join(this.project.getSourcePath(), 'assets', 'img');
        const distImgRoot = path.join(this.project.getDistPath(), 'assets', 'img');

        if (!fs.existsSync(imgRoot)) return;

        const files = await fastGlob('**/*.svg', {
            cwd: imgRoot,
            onlyFiles: true,
            caseSensitiveMatch: false
        });

        await Promise.all(files.map(async file => {
            const sourcePath = path.join(imgRoot, file);
            const outputPath = path.join(distImgRoot, file);
            const content = fs.readFileSync(sourcePath, 'utf8');
            const result = optimize(content, {
                path: sourcePath,
                multipass: true
            });

            if (result.error) {
                throw new Error(`Failed to optimize SVG "${file}": ${result.error}`);
            }
            this.diagnostics.recordArtifact(new BuildArtifact({
                type: 'image',
                lang: null,
                name: file,
                size: Buffer.byteLength(result.data, 'utf-8'),
                createdBy: 'AssetPipeline'
            }));
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, result.data);
        }));
    }
}
