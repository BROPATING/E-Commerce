import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Check for the ProductImages exist or not 
const uploadDir = path.join(__dirname, '..', '..', 'ProductImages'); 
//'..': "Leave middleware and go up to the src folder."
// '..': "Leave src and go up to the main MyProject folder."
if(!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, {recursive: true});  //Make Directory Synchronously.
    //This is the "official" and safest way to create folders.
    // If your path is ./uploads/products/images and none of those folders exist, recursive: true will create all three of them in one go.
    // Without this, it would fail if the parent folder (uploads) was missing.
}

/**
 * Disk storage engine — controls where and how uploaded files are saved.
 * We generate a unique filename to prevent collisions and path traversal attacks.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => { // Callback
        cb(null, uploadDir); //"Hey Multer, there were no errors (null), and I want you to put this file in the uploadDir folder."
    },

    filename: (req, file, cb) => {
        // Sanitise original filename — remove spaces and special characters
        // Example Summer Sale 2026! ---> abc.png	Summer_Sale_2026___png	! and abc are replaced by _.
        const sanitised = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        // Prepend timestamp for uniqueness — prevents cache collisions
        const unique = `${Date.now()} --- ${sanitised}`;
        cb(null, unique); 
    }
});

/**
 * File filter — only accept image MIME types.
 * Rejects PDFs, executables, and other non-image files at the multer level
 * before they ever touch the filesystem.
 */
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max — prevents denial-of-service via large uploads
  },
});
/**
 * Symbol          Meaning                  Analogy
    .            Current folder          "I am standing in this room."
    ..           Parent folder           "Go out the door into the hallway."
    ../..        Grandparent folder      "Go up two flights of stairs."
 */


