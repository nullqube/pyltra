/**
 * BuildArtifacts.mjs
 * @description Build artifacts diagnostics for the application.
 * @author [nullqube]
 * @version 1.0.0
 * @license MIT
 */

export interface BuildArtifactOptions {
    type: string;
    lang?: string;
    name: string;
    size: number;
    createdBy?: string;
}

export class BuildArtifact {
  createdBy?: string;
  name: string;
  size: number;
  type: string;
    constructor({
        type,
        lang,
        name,
        size,
        createdBy
    }: BuildArtifactOptions) {

        if (!type)
            throw new Error('type is required');

        if (!name)
            throw new Error('name is required');

        if (size == null)
            throw new Error('size is required');

        this.type = type;
        this.name = name;
        this.size = size;
        this.createdBy = createdBy;
    }

    // get compressionRatio() {
    //     return this.finalSize / this.originalSize;
    // }
}