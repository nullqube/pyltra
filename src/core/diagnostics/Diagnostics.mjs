/**
 * Diagnostics.mjs
 * @description Diagnostics for the application.
 * @author [nullqube]
 * @version 1.0.0
 * @license MIT
 */

export class Diagnostics {
    constructor() {
        this.artifacts = [];
    }

    add(artifact) {
        this.artifacts.push(artifact);
    }

    getArtifacts() {
        return this.artifacts;
    }

    getSummary() {
        return {
            total: this.artifacts.length,
            byType: this.artifacts.reduce((acc, artifact) => {
                acc[artifact.type] = (acc[artifact.type] || 0) + 1;
                return acc;
            }, {})
        };
    }
}