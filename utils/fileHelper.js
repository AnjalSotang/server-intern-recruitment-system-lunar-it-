// utils/fileHelper.js

const getFileUrl = (filename, fileType = 'image') => {
    if (!filename) return null;
    
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    if (fileType === 'image') {
        return `${baseUrl}/api/images/${filename}`;
    } else if (fileType === 'resume') {
        return `${baseUrl}/api/resumes/${filename}`;
    }
    
    return null;
};

const getImageUrl = (filename) => getFileUrl(filename, 'image');
const getResumeUrl = (filename) => getFileUrl(filename, 'resume');

module.exports = {
    getFileUrl,
    getImageUrl,
    getResumeUrl
};