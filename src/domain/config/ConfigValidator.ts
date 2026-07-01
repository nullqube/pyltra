//
//
//

import type { Project } from '../../project/Project.ts';

export default class ConfigValidator {
  project: Project;
    constructor(project: Project) {
        this.project = project;
    }

    async validate() {
        return true;
    }
}
