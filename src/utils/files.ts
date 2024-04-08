import fs from 'fs';
import { Request } from 'express';
import formidable, { File } from 'formidable';
import { isEmpty } from 'lodash';
import {
  UPLOAD_IMAGE_TEMP_DIR,
  UPLOAD_VIDEO_DIR,
  UPLOAD_VIDEO_TEMP_DIR
} from '@constants/configs';

export const initFolder = () => {
  [UPLOAD_IMAGE_TEMP_DIR, UPLOAD_VIDEO_TEMP_DIR].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, {
        recursive: true
      });
    }
  });
};

export const handleUploadImage = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_IMAGE_TEMP_DIR,
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
        return reject(err);
      }

      if (isEmpty(files)) {
        return reject(new Error('File is empty'));
      }

      resolve(files.image as File[]);
    });
  });
};

export const handleUploadVideo = (req: Request) => {
  const form = formidable({
    uploadDir: UPLOAD_VIDEO_DIR,
    maxFiles: 1,
    maxFileSize: 50 * 1024 * 1024, //50MB
    filter: ({ name, mimetype }) => {
      return true;
      // const isValid = name === 'image' && Boolean(mimetype?.includes('image/'));

      // if (!isValid) {
      //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //   form.emit('error' as any, new Error('File type is not valid') as any);
      // }

      // return isValid;
    }
  });

  return new Promise<File[]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        return reject(err);
      }

      if (isEmpty(files)) {
        return reject(new Error('File is empty'));
      }

      const videos = files.video as File[];

      videos.forEach((video) => {
        const ext = getExtension(video.originalFilename as string);
        fs.renameSync(video.filepath, video.filepath + '.' + ext);
        video.newFilename = video.newFilename + '.' + ext;
      });
      resolve(files.video as File[]);
    });
  });
};

export const getNameFile = (fullName: string) => {
  const [name, _extension] = fullName.split('.');

  return name;
};

export const getExtension = (fullname: string) => {
  const nameArr = fullname.split('.');
  return nameArr[nameArr.length - 1];
};
