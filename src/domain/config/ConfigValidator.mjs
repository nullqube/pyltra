// 
// 
// 

export default class ConfigValidator {
    constructor(project) {
        this.project = project;
    }

    async validate() {
        const config = this.project.getConfig();

        // Basic validation
        if (!config.pages || typeof config.pages !== 'object') {
            throw new Error('Invalid config: "pages" section is required and must be an object.');
        }

        // Validate each page
        for (const [pageName, pageConfig] of Object.entries(config.pages)) {
            if (!pageConfig.template) {
                throw new Error(`Page "${pageName}" is missing a "template" property.`);
            }
            if (!pageConfig.output) {
                throw new Error(`Page "${pageName}" is missing an "output" property.`);
            }
        }

        // Additional validations can be added here (e.g., check for reserved keywords, validate paths, etc.)
    }
}