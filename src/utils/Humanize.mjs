//
// 
// 

export class Humanize {
    static fileSize(bytes) {
        if (bytes < 1024) {
            return `${bytes} B`;
        }

        const units = ["KB", "MB", "GB", "TB"];
        let size = bytes / 1024;
        let unit = 0;

        while (size >= 1024 && unit < units.length - 1) {
            size /= 1024;
            unit++;
        }

        const decimals =
            size >= 100 ? 0 :
            size >= 10  ? 1 :
                        2;

        return `${size.toFixed(decimals)} ${units[unit]}`;
    }

    static duration(milliseconds) {
        if (milliseconds < 1000) {
            return `${milliseconds.toFixed(0)} ms`;
        }

        const seconds = milliseconds / 1000;

        if (seconds < 60) {
            return `${seconds.toFixed(seconds >= 10 ? 1 : 2)} s`;
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        if (minutes < 60) {
            return `${minutes} min ${remainingSeconds.toFixed(0)} s`;
        }

        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        return `${hours} h ${remainingMinutes} min`;
    }

    static percentage(value) {
        const percentage = value * 100;

        const decimals =
            percentage >= 100 ? 0 :
            percentage >= 10  ? 1 :
                                2;

        return `${percentage.toFixed(decimals)}%`;
    }
}