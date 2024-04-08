import argv from 'minimist';
import path from 'path';
const options = argv(process.argv.slice(2));

export const UPLOAD_IMAGE_TEMP_DIR = path.resolve('uploads/images/temp');
export const UPLOAD_IMAGE_DIR = path.resolve('uploads/images');
export const UPLOAD_VIDEO_TEMP_DIR = path.resolve('uploads/videos/temp');
export const UPLOAD_VIDEO_DIR = path.resolve('uploads/videos');

export const isProduction = Boolean(options.production);
