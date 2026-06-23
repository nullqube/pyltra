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
        size,
        createdBy
    }) {

        if (!type)
            throw new Error('type is required');

        if (!path)
            throw new Error('path is required');

        if (size == null)
            throw new Error('size is required');

        this.type = type;
        this.path = path;
        this.size = size;
        this.createdBy = createdBy;
    }

    // get compressionRatio() {
    //     return this.finalSize / this.originalSize;
    // }
}