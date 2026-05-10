import { createNunjucksEnvironment } from '../../renderer/NunjucksEnvironment.mjs';

export class TemplateEngine {
    constructor(project) {
        this.project = project;
        this.env = createNunjucksEnvironment(project);
    }

    render(templateName, data) {
        return this.env.render(templateName, data);
    }
}
