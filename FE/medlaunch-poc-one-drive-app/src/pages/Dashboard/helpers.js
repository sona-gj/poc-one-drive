import * as api from '../../api/onedrive';

export const fetchFilesAndFolders = async (sessionId, setFiles, setCurrentFolderId, setCurrentFolderName, setCurrentSection, setCurrentRemoteDriveId, folderId = null, folderName = 'My File', section = 'root', remoteDriveId = null, remoteItemId = null) => {
    try {
        let filesRes;
        if (remoteDriveId && remoteItemId) {
            filesRes = await api.getFilesByRemote(sessionId, remoteDriveId, remoteItemId);
        } else if (folderId) {
            filesRes = await api.getFilesById(sessionId, folderId);
        } else {
            filesRes = await api.getRootFiles(sessionId);
        }
        setFiles(filesRes);
        setCurrentFolderId(folderId);
        setCurrentFolderName(folderName);
        setCurrentSection(section);
        if (remoteDriveId && remoteItemId) {
            setCurrentRemoteDriveId(remoteDriveId);
        } else if (section !== 'sharedWithMe') {
            setCurrentRemoteDriveId(null);
        }
    } catch (err) {
        setFiles([]);
    }
};

export const handleFileChange = async (e, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId) => {
    const file = e.target.files[0];
    if (!file) return;
    const sessionId = localStorage.getItem('sessionId');
    const formData = new FormData();
    formData.append('file', file);
    try {
        await api.uploadFile(sessionId, formData);
        alert('File uploaded!');
        fetchFilesAndFolders(sessionId, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId, currentFolderId);
    } catch (err) {
        alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
};

export const handleFolderUpload = async (e, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const sessionId = localStorage.getItem('sessionId');
    const rootFolderName = files[0].webkitRelativePath.split('/')[0];
    // Create folder
    let parentId = null;
    try {
        parentId = await api.createFolder(sessionId, rootFolderName);
    } catch (err) {
        alert('Failed to create folder in OneDrive');
        return;
    }
    // Upload all files
    for (const file of files) {
        const relativePath = file.webkitRelativePath.replace(rootFolderName + '/', '');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('parentId', parentId);
        formData.append('relativePath', relativePath);
        try {
            await api.uploadFile(sessionId, formData);
        } catch (err) {
            alert('Failed to upload file: ' + file.name);
        }
    }
    alert('Folder and files uploaded!');
    fetchFilesAndFolders(sessionId, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId, currentFolderId);
};

export const handleShare = async (item, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId) => {
    const emails = prompt('Enter emails to share with (comma-separated):');
    if (!emails) return;
    const role = window.confirm('Give edit permission? (OK for Edit, Cancel for View)') ? 'edit' : 'view';
    const sessionId = localStorage.getItem('sessionId');
    try {
        await api.shareItem(sessionId, item.id, emails.split(',').map(e => e.trim()), role);
        alert('Sharing updated!');
        fetchFilesAndFolders(sessionId, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId, currentFolderId);
    } catch (err) {
        alert('Share failed: ' + (err.response?.data?.error || err.message));
    }
};

export const handleFolderClick = (folder, setFiles, setCurrentFolderId, setCurrentFolderName, setCurrentSection, setCurrentRemoteDriveId, currentSection, currentRemoteDriveId) => {
    const sessionId = localStorage.getItem('sessionId');
    // --- Shared with me root nav ---
    if (folder.remoteItem && folder.remoteItem.parentReference && folder.remoteItem.id) {
        fetchFilesAndFolders(
            sessionId,
            setFiles,
            setCurrentFolderId,
            setCurrentFolderName,
            setCurrentSection,
            setCurrentRemoteDriveId,
            folder.id,
            folder.name,
            'sharedWithMe',
            folder.remoteItem.parentReference.driveId,
            folder.remoteItem.id
        );
        setCurrentRemoteDriveId(folder.remoteItem.parentReference.driveId);
    }
    // --- Shared with me, subfolder nav ---
    else if (currentSection === 'sharedWithMe' && currentRemoteDriveId) {
        fetchFilesAndFolders(
            sessionId,
            setFiles,
            setCurrentFolderId,
            setCurrentFolderName,
            setCurrentSection,
            setCurrentRemoteDriveId,
            folder.id,
            folder.name,
            'sharedWithMe',
            currentRemoteDriveId,
            folder.id
        );
    }
    // --- Local folder nav ---
    else {
        fetchFilesAndFolders(sessionId, setFiles, setCurrentFolderId, setCurrentFolderName, setCurrentSection, setCurrentRemoteDriveId, folder.id, folder.name, currentSection);
    }
}; 