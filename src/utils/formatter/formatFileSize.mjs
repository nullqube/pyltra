// in the name of god
//
//

export function formatFileSize(bytes) {
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