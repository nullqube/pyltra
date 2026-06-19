/**
 * BuildArtifacts.mjs
 * @description Build artifacts diagnostics for the application.
 * @author [nullqube]
 * @version 1.0.0
 * @license MIT
 */

export class BuildArtifact {
    constructor({
        type,
        path,
        originalSize,
        finalSize,
        createdBy
    }) {

        if (!type)
            throw new Error('type is required');

        if (!path)
            throw new Error('path is required');

        if (originalSize == null)
            throw new Error('originalSize is required');

        if (finalSize == null)
            throw new Error('finalSize is required');

        this.type = type;
        this.path = path;
        this.originalSize = originalSize;
        this.finalSize = finalSize;
        this.createdBy = createdBy;
    }

    get compressionRatio() {
        return this.finalSize / this.originalSize;
    }
}