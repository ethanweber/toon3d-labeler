import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';

function PointUploader({ onUpload }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const uploadFile = (file) => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (readerEvent) => {
      const content = readerEvent.target.result;
      onUpload(content);
    };
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFile(e.dataTransfer.files[0]); // Handle the file from the drop
      e.dataTransfer.clearData(); // Clear the drag data cache (for all formats/types)
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const dragStyle = {
    backgroundColor: isDragOver ? '#f8f9fa' : '', // Light grey background when dragging over
    borderColor: isDragOver ? '#007bff' : '', // Blue border color when dragging over
    color: isDragOver ? '#007bff' : '', // Blue text color when dragging over
  };

  return (
    <Button
      className="m-2"
      onClick={() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          if (e.target.files && e.target.files.length > 0) {
            uploadFile(e.target.files[0]);
          }
        };
        input.click();
      }}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={dragStyle} // Apply inline styles based on drag state
    >
      Import
    </Button>
  );
}

export default PointUploader;
