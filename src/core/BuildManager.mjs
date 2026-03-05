// 
// 
// 

class BuildManager {
    constructor( project ) {
        this.project = project;

        this.renderer = new Renderer(project);
        this.assets = new AssetPipeline(project);
        this.validator = new ConfigValidator(project);
    }

    async build() {
        await this.validator.validate();
        await this.clean();
        await this.renderer.renderAll();
        await this.assets.processAll();
    }

    async clean() { }
}