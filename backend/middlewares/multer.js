import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";

// Vercel's deployed application directory is read-only. Files uploaded through
// Multer only exist long enough to be sent to Cloudinary, so use the writable
// system temporary directory instead.
const uploadDir = path.join(os.tmpdir(), "linkdin-uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Prefix with a timestamp + random suffix so simultaneous
    // uploads (or two files with the same name) never collide.
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "");
    cb(null, `${base || "file"}-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      "Only image files (jpeg, png, webp, gif) are allowed"
    );
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

export default upload;
