import fs from 'fs';
import { join } from 'path';
import { Config, Languages, PATHS } from '../utils/config.mjs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * @typedef {Object} ValidationResult
 * @property {string[]} errors   - Block the build
 * @property {string[]} warnings - Continue with fallback
 */

/** @returns {ValidationResult} */
function createResult() {
    return { errors: [], warnings: [] };
}

function fileExists(path) {
    return fs.existsSync(path);
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

/**
 * Validates that all templates referenced in collections exist.
 * @param {ValidationResult} result
 */
function validateTemplates(result) {
    const paths      = PATHS();
    const config     = Config();
    const srcTemplates = `${paths.src}/templates`;

    for (const [name, col] of Object.entries(config.collections)) {
        if (col.template) {
            const p = join(srcTemplates, col.template);
            if (!fileExists(p))
                result.errors.push(`Collection "${name}": template not found → ${p}`);
        }
        if (col.item_template) {
            const p = join(srcTemplates, col.item_template);
            if (!fileExists(p))
                result.errors.push(`Collection "${name}": item_template not found → ${p}`);
        }
    }
}

/**
 * Validates that page data files exist for each language.
 * Missing page files are warnings (fallbacks handle them).
 * @param {ValidationResult} result
 */
function validatePageData(result) {
    const paths    = PATHS();
    const config   = Config();
    const languages = Languages();

    for (const lang of languages) {
        for (const [key, value] of Object.entries(config.pages)) {
            const { file = '' } = value ?? {};
            const fileName = file
                ? file.replace('${lang}', lang)
                : `${lang}/${key}.yaml`;
            const filePath = join(paths.data, fileName);

            if (!fileExists(filePath))
                result.warnings.push(`Page "${key}" [${lang}]: data file not found → ${filePath}`);
        }
    }
}

/**
 * Validates that collection data files and item files exist per language.
 * Missing collection dataFile is an error. Missing item files are warnings.
 * @param {ValidationResult} result
 */
function validateCollectionData(result) {
    const paths     = PATHS();
    const config    = Config();
    const languages = Languages();

    for (const lang of languages) {
        for (const [name, col] of Object.entries(config.collections)) {
            // Collection data file — error if missing
            const dataFileName = col.dataFile.replace('${lang}', lang);
            const dataFilePath = join(paths.data, dataFileName);
            if (!fileExists(dataFilePath)) {
                result.errors.push(`Collection "${name}" [${lang}]: dataFile not found → ${dataFilePath}`);
            }

            // Individual item files — warning if missing (fallback handles it)
            for (const item of col.items) {
                const itemFileName = item.file.replace('${lang}', lang);
                const itemFilePath = join(paths.data, itemFileName);
                if (!fileExists(itemFilePath)) {
                    result.warnings.push(
                        `Collection "${name}" [${lang}]: item "${item.slug}" file not found → ${itemFilePath}`
                    );
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

/**
 * Prints a formatted validation report to the console.
 * @param {ValidationResult} result
 */
function printReport(result) {
    const { errors, warnings } = result;
    const total = errors.length + warnings.length;

    if (total === 0) {
        console.log('✅ Validation passed — no issues found.\n');
        return;
    }

    console.log('\n── Validation Report ──────────────────────────────');

    if (warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${warnings.length}) — build will continue with fallbacks:`);
        warnings.forEach(w => console.warn(`   • ${w}`));
    }

    if (errors.length > 0) {
        console.log(`\n❌ Errors (${errors.length}) — build cannot continue:`);
        errors.forEach(e => console.error(`   • ${e}`));
    }

    console.log('\n────────────────────────────────────────────────────\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

/**
 * Runs all validations. Throws if any errors are found.
 * Warnings are printed but do not block the build.
 */
export function validateProject() {
    console.log('Validating project...');

    const result = createResult();

    validateTemplates(result);
    validatePageData(result);
    validateCollectionData(result);

    printReport(result);

    if (result.errors.length > 0) {
        throw new Error(
            `Validation failed with ${result.errors.length} error(s). Fix them before building.`
        );
    }
}
