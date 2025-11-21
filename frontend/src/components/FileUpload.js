import React, { useState } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

/**
 * Reusable File Upload Component
 * 
 * Props:
 * - label: Display label for the upload field
 * - name: Unique identifier for this field
 * - value: Current file URL (for display)
 * - onChange: Callback when file is uploaded (receives URL)
 * - accept: File types to accept (default: all)
 * - uploadEndpoint: API endpoint for upload (default: '/api/upload/document')
 * - maxSize: Max file size in MB (default: 5)
 * - disabled: Disable upload functionality
 * - required: Mark field as required
 * - helpText: Additional help text to display
 */
const FileUpload = ({
  label,
  name,
  value = "",
  onChange,
  accept = "*",
  uploadEndpoint = "/api/upload/document",
  maxSize = 5,
  disabled = false,
  required = false,
  helpText = ""
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(value);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      e.target.value = '';
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const token = sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('Session expired. Please login again.');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fieldName', name);

      const response = await fetch(`${API_BASE_URL}${uploadEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        const fileUrl = result.data.file_url || result.data.url;
        setPreview(fileUrl);
        
        // Call parent's onChange with the URL
        if (onChange) {
          onChange(fileUrl);
        }
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview("");
    setError(null);
    if (onChange) {
      onChange("");
    }
  };

  const getFileExtension = (url) => {
    if (!url) return '';
    return url.split('.').pop().toLowerCase();
  };

  const isImageFile = (url) => {
    const ext = getFileExtension(url);
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext);
  };

  const getFileName = (url) => {
    if (!url) return '';
    return url.split('/').pop();
  };

  return (
    <div className="file-upload-wrapper">
      <label className="form-label fw-semibold">
        {label}
        {required && <span className="text-danger ms-1">*</span>}
      </label>
      
      {helpText && (
        <small className="form-text text-muted d-block mb-2">{helpText}</small>
      )}

      <div className="input-group">
        <input
          type="file"
          className="form-control"
          accept={accept}
          onChange={handleFileSelect}
          disabled={disabled || uploading}
          id={`file-${name}`}
        />
        
        {preview && !uploading && (
          <button
            type="button"
            className="btn btn-outline-danger"
            onClick={handleRemove}
            disabled={disabled}
            title="Remove file"
          >
            <i className="bi bi-trash"></i>
          </button>
        )}
      </div>

      {uploading && (
        <div className="mt-2">
          <div className="progress" style={{ height: '20px' }}>
            <div 
              className="progress-bar progress-bar-striped progress-bar-animated" 
              role="progressbar" 
              style={{ width: '100%' }}
            >
              Uploading...
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger mt-2 py-2 mb-0">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {preview && !uploading && (
        <div className="mt-2">
          <div className="card">
            <div className="card-body p-2">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  {isImageFile(preview) ? (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="img-thumbnail me-2"
                      style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                    />
                  ) : (
                    <i className="bi bi-file-earmark-text fs-3 me-2 text-primary"></i>
                  )}
                  <div>
                    <small className="text-muted d-block">Current file:</small>
                    <small className="fw-semibold">{getFileName(preview)}</small>
                  </div>
                </div>
                <a 
                  href={preview} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="bi bi-eye me-1"></i> View
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;