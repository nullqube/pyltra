// 
// 
// 

class Renderer {
    constructor(project) {
        this.project = project;
        this.templateEngine = new TemplateEngine(project);
        this.dataLoader = new DataLoader(project);
    }

    async renderAll() {
        for( const lang of this.project.languages ) {
            await this.renderLanguage(lang);
        }
    }

    async renderLanguage( lang ) {
        const data = this.dataLoader.load(lang);

        // produce output files
    }
}