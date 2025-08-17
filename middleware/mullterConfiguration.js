// middleware/multerConfiguration.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const resumeDir = './storage/resumes';
const imageDir = './storage/images';

// Ensure both directories exist
[resumeDir, imageDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// File type validation
const fileFilter = (req, file, cb) => {
    // Define allowed file types based on user role
    const allowedResumeTypes = /\.(pdf|doc|docx)$/i;
    const allowedImageTypes = /\.(jpg|jpeg|png|gif|webp)$/i;
    
    console.log(req.user.role)

    if (req.user?.role === 'admin') {
        // Admin uploading images
        if (allowedImageTypes.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('Admin can only upload image files (jpg, jpeg, png, gif, webp)'), false);
        }
    } else {
        // Regular users uploading resumes
        if (allowedResumeTypes.test(path.extname(file.originalname))) {
            cb(null, true);
        } else {
            cb(new Error('Only resume files are allowed (pdf, doc, docx)'), false);
        }
    }
};

// Configure dynamic storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Check if user is authenticated
        if (!req.user) {
            return cb(new Error('User authentication required'), null);
        }

        let uploadPath = resumeDir; // default for regular users

        // Admin uploads go to images directory
        if (req.user.role === 'admin') {
            uploadPath = imageDir;
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // Sanitize original filename
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(sanitizedName);
        const baseName = path.basename(sanitizedName, fileExtension);
        
        // Create filename: fieldname-basename-timestamp.ext
        const filename = `${file.fieldname}-${baseName}-${uniqueSuffix}${fileExtension}`;
        cb(null, filename);
    }
});

// Create upload middleware with different configurations
const createUpload = (options = {}) => {
    return multer({
        storage,
        fileFilter,
        limits: { 
            fileSize: options.fileSize || 5 * 1024 * 1024, // 5MB default
            files: options.maxFiles || 1 // 1 file default
        }
    });
};

// Pre-configured upload instances
const upload = createUpload();
const uploadMultiple = createUpload({ maxFiles: 5 });
const uploadLarge = createUpload({ fileSize: 10 * 1024 * 1024 }); // 10MB

module.exports = {
    upload,
    uploadMultiple,
    uploadLarge,
    createUpload,
    resumeDir,
    imageDir
};