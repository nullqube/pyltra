/**
 * Diagnostics.mjs
 * @description Diagnostics for the application.
 * @author [nullqube]
 * @version 1.0.0
 * @license MIT
 */

import {BuildArtifact} from './BuildArtifact.mjs';
export class Diagnostics {
    constructor() {
        this.artifacts = [];
    }

    recordArtifact(artifact) {
        if (!(artifact instanceof BuildArtifact))
            throw new Error('artifact must be an instance of BuildArtifact');

        this.artifacts.push(artifact);
    }

    getArtifacts() {
        return this.artifacts;
    }

    getSummary() {
        // return {
        //     total: this.artifacts.length,
        //     byType: this.artifacts.reduce((acc, artifact) => {
        //         acc[artifact.type] = (acc[artifact.type] || 0) + 1;
        //         return acc;
        //     }, {})
        // };
        // Calcul;ate total size of all artifacts
        const totalSize = this.artifacts.reduce((acc, artifact) => acc + artifact.size, 0);
        
        return {
            total: this.artifacts.length,
            totalSize
        };
    }

    buildSizeReport() {
        return {
            byType: this.artifacts.reduce((acc,artifact) => {
                if (!acc[artifact.type]) {
                    acc[artifact.type] = {
                        count: 0,
                        totalSize: 0
                    };
                }
                acc[artifact.type].count += 1;
                acc[artifact.type].totalSize += artifact.size;
                return acc;
            }, {})
        };
    }
}