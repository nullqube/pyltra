// 
// 
// 

class DevServer {
    constructor( project, buildManager ) {
        this.project = project;
        this.buildManager = buildManager;
    }

    async start() {
        await this.buildManager.build();
        this.startBrowserSync();
        this.watchFiles();
    }

    stop() { }
}