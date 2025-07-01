import React from 'react';
import './UploadButton.css';

function UploadButton({ fileInputRef, folderInputRef, onFileChange, onFolderUpload }) {
    return (
        <>
            <input
                type="file"
                ref={folderInputRef}
                style={{ display: 'none' }}
                onChange={onFolderUpload}
                webkitdirectory="true"
                directory=""
            />
            <button onClick={() => folderInputRef.current.click()}>+ Upload Folder</button>
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={onFileChange}
            />
            <button onClick={() => fileInputRef.current.click()}>Upload Document</button>
        </>
    );
}

export default UploadButton; 