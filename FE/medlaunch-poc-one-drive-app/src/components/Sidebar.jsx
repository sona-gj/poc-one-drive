import React from 'react';
import './Sidebar.css';

function Sidebar({
    allSharedByYou = [],
    allSharedWithMe = [],
    currentFolderId,
    currentSection,
    setCurrentSection,
    setCurrentFolderId,
    setCurrentFolderName,
    setFiles,
    setCurrentRemoteDriveId,
    fetchFilesAndFolders
}) {
    // Helper to render folders in sidebar
    const renderSidebarFolders = (folders, section) => (
        <ul style={{ listStyle: "none", paddingLeft: 0 }}>
            {folders.map(folder => (
                <li key={folder.id || folder.name}>
                    <div
                        style={{
                            marginLeft: 16,
                            marginBottom: 8,
                            color: currentFolderId === folder.id && currentSection === section ? '#2563eb' : '#6b7280',
                            fontWeight: currentFolderId === folder.id && currentSection === section ? 700 : 400,
                            cursor: 'pointer',
                            borderLeft: currentFolderId === folder.id && currentSection === section ? '2px solid #2563eb' : '2px solid transparent',
                            paddingLeft: 8,
                            background: currentFolderId === folder.id && currentSection === section ? '#eef3fd' : 'transparent'
                        }}
                        onClick={() => {
                            if (section === "sharedWithMe") {
                                if (folder.remoteItem && folder.remoteItem.parentReference && folder.remoteItem.id) {
                                    setCurrentRemoteDriveId(folder.remoteItem.parentReference.driveId);
                                    fetchFilesAndFolders(
                                        localStorage.getItem('sessionId'),
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
                                } else if (currentFolderId) {
                                    fetchFilesAndFolders(
                                        localStorage.getItem('sessionId'),
                                        setFiles,
                                        setCurrentFolderId,
                                        setCurrentFolderName,
                                        setCurrentSection,
                                        setCurrentRemoteDriveId,
                                        folder.id,
                                        folder.name,
                                        'sharedWithMe',
                                        currentFolderId,
                                        folder.id
                                    );
                                }
                            } else {
                                fetchFilesAndFolders(
                                    localStorage.getItem('sessionId'),
                                    setFiles,
                                    setCurrentFolderId,
                                    setCurrentFolderName,
                                    setCurrentSection,
                                    setCurrentRemoteDriveId,
                                    folder.id,
                                    folder.name,
                                    section
                                );
                            }
                        }}
                    >
                        📁 {folder.name}
                    </div>
                </li>
            ))}
        </ul>
    );

    return (
        <aside className="sidebar" style={{ width: 260, background: '#fff', borderRight: '1px solid #e5e7eb', padding: '2rem 1rem 1rem 1.5rem' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 32 }}>Katherine Martinez</div>
            <nav>
                <div style={{ marginBottom: 24 }}>
                    <div
                        style={{
                            color: currentFolderId === null && currentSection === 'root' ? '#2563eb' : '#6b7280',
                            fontWeight: currentFolderId === null && currentSection === 'root' ? 700 : 400,
                            marginBottom: 8,
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            const sessionId = localStorage.getItem('sessionId');
                            fetchFilesAndFolders(sessionId, setFiles, setCurrentFolderId, setCurrentFolderName, setCurrentSection, setCurrentRemoteDriveId, null, 'My File', 'root');
                        }}
                    >
                        ● Recent
                    </div>
                    <div style={{ color: '#6b7280', marginBottom: 8, cursor: 'pointer' }}>☆ Favorites</div>
                    <div style={{ color: '#6b7280', marginBottom: 8, cursor: 'pointer' }}>🗂 My File</div>
                    <div style={{ color: '#6b7280', marginBottom: 24, cursor: 'pointer' }}>🗑 Recycle bin</div>
                </div>
                {allSharedByYou.length > 0 && (
                    <>
                        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 16, color: 'black' }}>Shared by You</div>
                        {renderSidebarFolders(allSharedByYou, 'shared')}
                    </>
                )}
                {allSharedWithMe.length > 0 && (
                    <>
                        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 16, color: 'black' }}>Shared with You</div>
                        <div
                            style={{
                                marginLeft: 16,
                                marginBottom: 8,
                                color: currentFolderId === 'all-shared' && currentSection === 'sharedWithMe' ? '#2563eb' : '#6b7280',
                                fontWeight: currentFolderId === 'all-shared' && currentSection === 'sharedWithMe' ? 700 : 400,
                                cursor: 'pointer',
                                borderLeft: currentFolderId === 'all-shared' && currentSection === 'sharedWithMe' ? '2px solid #2563eb' : '2px solid transparent',
                                paddingLeft: 8,
                                background: currentFolderId === 'all-shared' && currentSection === 'sharedWithMe' ? '#eef3fd' : 'transparent'
                            }}
                            onClick={() => {
                                setCurrentSection('sharedWithMe');
                                setCurrentFolderId('all-shared');
                                setCurrentFolderName('All Shared Items');
                                setFiles(allSharedWithMe);
                            }}
                        >
                            📋 All
                        </div>
                        {renderSidebarFolders(allSharedWithMe.filter(item => item.folder), 'sharedWithMe')}
                    </>
                )}
            </nav>
        </aside>
    );
}

export default Sidebar; 