// 
// 
// 

class AssetPipeline {
    constructor( project ) {
        this.project = project;
    }

    async processAll() {
        await this.processSCSS();
        await this.processJS();
        await this.processImages();
    }
}