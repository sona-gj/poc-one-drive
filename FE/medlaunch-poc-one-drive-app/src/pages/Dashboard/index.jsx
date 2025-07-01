import React, { useEffect, useState, useRef } from 'react';
import './style.css';
import * as api from '../../api/onedrive';
import Sidebar from '../../components/Sidebar';
import DataTable from '../../components/DataTable';
import UploadButton from '../../components/UploadButton';
import { handleFileChange, handleFolderUpload, handleShare, handleFolderClick, fetchFilesAndFolders } from './helpers';

function Dashboard() {
    // State and refs
    const [files, setFiles] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [currentFolderName, setCurrentFolderName] = useState('My File');
    const [currentSection, setCurrentSection] = useState('root');
    const [allSharedByYou, setAllSharedByYou] = useState([]);
    const [allSharedWithMe, setAllSharedWithMe] = useState([]);
    const [currentRemoteDriveId, setCurrentRemoteDriveId] = useState(null);
    const fileInputRef = useRef();
    const folderInputRef = useRef();

    // Column configurations for DataTable
    const documentColumns = [
        { key: 'name', header: 'Document Name' },
        {
            key: 'type',
            header: 'Type',
            render: (doc) => doc.file ? doc.file.mimeType : 'Unknown'
        },
        {
            key: 'sharing',
            header: 'Sharing',
            render: (doc) => {
                if (!doc.shared) return 'Private';
                switch (doc.shared.scope) {
                    case 'organization': return 'Organization';
                    case 'users': return 'Shared';
                    case 'anonymous': return 'Anyone with link';
                    default: return doc.shared.scope;
                }
            }
        },
        {
            key: 'webLink',
            header: 'Web Link',
            render: (doc) => doc.webUrl ?
                <a href={doc.webUrl} target="_blank" rel="noopener noreferrer">Open</a> :
                '-'
        }
    ];

    const folderColumns = [
        {
            key: 'name',
            header: 'Folder Name',
            render: (folder) => (
                <span style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>
                    {folder.name}
                </span>
            )
        },
        {
            key: 'sharing',
            header: 'Sharing',
            render: (folder) => {
                if (!folder.shared) return 'Private';
                switch (folder.shared.scope) {
                    case 'organization': return 'Organization';
                    case 'users': return 'Shared';
                    case 'anonymous': return 'Anyone with link';
                    default: return folder.shared.scope;
                }
            }
        },
        {
            key: 'webLink',
            header: 'Web Link',
            render: (folder) => folder.webUrl ?
                <a href={folder.webUrl} target="_blank" rel="noopener noreferrer">Open</a> :
                '-'
        }
    ];

    // Actions for folders
    const folderActions = [
        {
            label: 'Share',
            variant: 'primary',
            onClick: (folder) => handleShare(folder, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId)
        }
    ];

    // Fetch files & folders for current context
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const sessionId = params.get('sessionId') || localStorage.getItem('sessionId');
        if (sessionId) {
            localStorage.setItem('sessionId', sessionId);
            window.history.replaceState({}, document.title, "/");
            (async () => {
                // Shared by you
                const rootFiles = await api.getRootFiles(sessionId);
                setAllSharedByYou(rootFiles.filter(f => f.folder && f.shared).map(f => ({ ...f, section: 'shared' })));
                // Shared with you
                const sharedWithMe = await api.getSharedWithMe(sessionId);
                setAllSharedWithMe(sharedWithMe.map(f => ({ ...f, section: 'sharedWithMe' })));
                // Root files
                fetchFilesAndFolders(sessionId, setFiles, setCurrentFolderId, setCurrentFolderName, setCurrentSection, setCurrentRemoteDriveId, null, 'My File', 'root');
            })();
        }
    }, []);

    const documents = files.filter(item => !item.folder);
    const folders = files.filter(item => item.folder);

    return (
        <div className="app-container">
            <Sidebar
                allSharedByYou={allSharedByYou}
                allSharedWithMe={allSharedWithMe}
                currentFolderId={currentFolderId}
                currentSection={currentSection}
                setCurrentSection={setCurrentSection}
                setCurrentFolderId={setCurrentFolderId}
                setCurrentFolderName={setCurrentFolderName}
                setFiles={setFiles}
                setCurrentRemoteDriveId={setCurrentRemoteDriveId}
                fetchFilesAndFolders={fetchFilesAndFolders}
            />
            <main className="main-content">
                <div className="top-bar">
                    <UploadButton
                        fileInputRef={fileInputRef}
                        folderInputRef={folderInputRef}
                        onFileChange={e => handleFileChange(e, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId)}
                        onFolderUpload={e => handleFolderUpload(e, setFiles, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId)}
                    />
                </div>
                <section className="main-table">
                    <h2>{currentFolderName}</h2>
                    <DataTable
                        title="Documents"
                        columns={documentColumns}
                        data={documents}
                        emptyMessage="No documents found"
                    />
                    <DataTable
                        title="Folders"
                        columns={folderColumns}
                        data={folders}
                        onRowClick={(folder) => handleFolderClick(folder, setFiles, setCurrentFolderId, setCurrentFolderName, setCurrentSection, setCurrentRemoteDriveId, currentSection, currentRemoteDriveId)}
                        actions={folderActions}
                        emptyMessage="No folders found"
                    />
                </section>
            </main>
        </div>
    );
}

export default Dashboard; 