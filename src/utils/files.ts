import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import formidable, { File, Files } from 'formidable';
import { isEmpty } from 'lodash';
import { UPLOAD_TEMP_DIR } from '@constants/configs';

export const initFolder = (folderPath: string) => {
  const uploadFolderPath = path.resolve(folderPath);
  if (!fs.existsSync(uploadFolderPath)) {
    fs.mkdirSync(uploadFolderPath, {
      recursive: true
    });
  }
};

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: path.resolve(UPLOAD_TEMP_DIR),
    maxFiles: 4,
    keepExtensions: true,
    maxFileSize: 300 * 1024, //300KB
    maxTotalFileSize: 300 * 1024 * 4, //300KB * 4 files
    filter: ({ name, mimetype }) => {
      const isValid = name === 'image' && Boolean(mimetype?.includes('image/'));

      if (!isValid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.emit('error' as any, new Error('File type is not valid') as any);
      }

      return isValid;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
      }

      if (isEmpty(files)) {
        reject(new Error('File is empty'));
      }

      resolve(files.image as File[]);
    });
  });
};

export const getNameFile = (fullName: string) => {
  const [name, _extension] = fullName.split('.');

  return name;
};
