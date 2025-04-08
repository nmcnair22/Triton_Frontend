/**
 * File Utilities
 * Provides helper functions for working with files
 */
import { AuthService } from '@/auth/AuthService';

/**
 * Get a URL for previewing a file with authentication
 * @param {string|number} fileId - The ID of the file to preview
 * @param {string} fileType - The type of file (e.g., 'pdf', 'image')
 * @returns {string} The authenticated preview URL
 */
export const getFilePreviewUrl = (fileId, fileType) => {
  return AuthService.getFilePreviewUrl(fileId, fileType);
};

/**
 * Add authentication token to a URL as a query parameter
 * @param {string} url - The URL to add the token to
 * @returns {string} The URL with authentication token
 */
export const addAuthTokenToUrl = (url) => {
  return AuthService.addTokenToUrl(url);
};

/**
 * Get the appropriate icon for a file based on its type or extension
 * @param {string} filename - The filename to analyze
 * @param {string} fileType - Optional file type override
 * @returns {string} The icon class to use
 */
export const getFileIcon = (filename, fileType = null) => {
  if (!filename && !fileType) return 'pi pi-file';
  
  // Use the provided fileType if available
  const type = fileType || getFileTypeFromFilename(filename);
  
  switch(type.toLowerCase()) {
    case 'pdf':
      return 'pi pi-file-pdf';
    case 'doc':
    case 'docx':
    case 'word':
      return 'pi pi-file-word';
    case 'xls':
    case 'xlsx':
    case 'excel':
      return 'pi pi-file-excel';
    case 'ppt':
    case 'pptx':
    case 'powerpoint':
      return 'pi pi-file-powerpoint';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'image':
      return 'pi pi-image';
    case 'zip':
    case 'rar':
    case 'gz':
    case 'tar':
    case 'archive':
      return 'pi pi-file-archive';
    case 'txt':
    case 'text':
      return 'pi pi-file-text';
    case 'html':
    case 'css':
    case 'js':
    case 'code':
      return 'pi pi-file-code';
    default:
      return 'pi pi-file';
  }
};

/**
 * Extract the file extension from a filename
 * @param {string} filename - The filename to analyze
 * @returns {string} The file extension
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  
  return parts[parts.length - 1].toLowerCase();
};

/**
 * Determine file type from filename
 * @param {string} filename - The filename to analyze
 * @returns {string} The file type
 */
export const getFileTypeFromFilename = (filename) => {
  if (!filename) return '';
  
  const extension = getFileExtension(filename);
  if (!extension) return '';
  
  // Map file extensions to types
  const extensionToType = {
    'pdf': 'pdf',
    'doc': 'word',
    'docx': 'word',
    'xls': 'excel',
    'xlsx': 'excel',
    'ppt': 'powerpoint',
    'pptx': 'powerpoint',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'bmp': 'image',
    'zip': 'archive',
    'rar': 'archive',
    'gz': 'archive',
    'tar': 'archive',
    'txt': 'text',
    'html': 'code',
    'css': 'code',
    'js': 'code'
  };
  
  return extensionToType[extension] || extension;
};

/**
 * Format file size for display
 * @param {number} bytes - The file size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0 || !bytes) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Check if a file is viewable in the browser
 * @param {string} fileType - The file type or extension
 * @returns {boolean} Whether the file can be viewed in browser
 */
export const isViewableInBrowser = (fileType) => {
  if (!fileType) return false;
  
  const type = typeof fileType === 'string' ? fileType.toLowerCase() : '';
  const viewableTypes = ['pdf', 'image', 'jpg', 'jpeg', 'png', 'gif'];
  
  return viewableTypes.includes(type);
};

export default {
  getFilePreviewUrl,
  addAuthTokenToUrl,
  getFileIcon,
  getFileExtension,
  getFileTypeFromFilename,
  formatFileSize,
  isViewableInBrowser
}; 