// 
// 
// 

class Project {
    constructor({ cwd = process.cwd(), mode = 'dev' }) {
        this.cwd = cwd;
        this.mode = mode;
        this.configLoader = new ConfigLoader(cwd);
    }

    load() {
        this.config = this.configLoader.load();
        this.paths = this.configLoader.getPaths();
    }

    isProd() {
        return this.mode == 'prod';
    }

    languages() {
        return this.config.languages.map( l => l.code );
    }
}