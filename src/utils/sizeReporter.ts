import size from 'gulp-size';

const reports = {};

export function sizeCollector(taskName) {
    return size({
        showFiles: false,
        showTotal: false,
        gzip: true,
        pretty: true,
        title: taskName,
        transform: (file, s) => {
            if (!reports[taskName]) {
                reports[taskName] = {
                    count: 0,
                    size: 0
                };
            }

            reports[taskName].count += 1;
            reports[taskName].size += s.size;
        }
    });
}

export function printSizeReport() {
    console.log('\n📦 Build size report:\n');

    Object.entries(reports).forEach(([task, data]) => {
        const kb = (data.size / 1024).toFixed(2);
        console.log(
            `• ${task}: ${kb} kB (gzipped) — ${data.count} files`
        );
    });

    console.log('');
}