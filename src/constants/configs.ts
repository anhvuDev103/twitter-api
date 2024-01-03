import argv from 'minimist';
const options = argv(process.argv.slice(2));

export const UPLOAD_TEMP_DIR = 'uploads/temp';
export const UPLOAD_DIR = 'uploads';
export const isProduction = Boolean(options.production);
