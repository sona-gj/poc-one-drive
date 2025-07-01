import { useEffect, useState, useRef } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const api = "http://localhost:5001";
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const folderInputRef = useRef();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('My File');
  const [currentSection, setCurrentSection] = useState('root');
  const [allSharedByYou, setAllSharedByYou] = useState([]);
  const [allSharedWithMe, setAllSharedWithMe] = useState([]);
  const [currentRemoteDriveId, setCurrentRemoteDriveId] = useState(null);

  // Fetch files & folders for current context
  const fetchFilesAndFolders = async (sessionId, folderId = null, folderName = 'My File', section = 'root', remoteDriveId = null, remoteItemId = null) => {
    try {
      let url;
      if (remoteDriveId && remoteItemId) {
        url = `${api}/api/files?remoteDriveId=${remoteDriveId}&remoteItemId=${remoteItemId}`;
      } else if (folderId) {
        url = `${api}/api/files?id=${folderId}`;
      } else {
        url = `${api}/api/files`;
      }
      const filesRes = await axios.get(url, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      setFiles(filesRes.data.value || filesRes.data);
      setCurrentFolderId(folderId);
      setCurrentFolderName(folderName);
      setCurrentSection(section);

      // Only update currentRemoteDriveId for top-level shared-with-me nav
      if (remoteDriveId && remoteItemId) {
        setCurrentRemoteDriveId(remoteDriveId);
      } else if (section !== 'sharedWithMe') {
        setCurrentRemoteDriveId(null);
      }
    } catch (err) {
      setFiles([]);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId') || localStorage.getItem('sessionId');
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
      window.history.replaceState({}, document.title, "/");
      (async () => {
        // Shared by you
        const rootRes = await axios.get(`${api}/api/files`, {
          headers: { Authorization: `Bearer ${sessionId}` }
        });
        const rootFiles = rootRes.data.value || rootRes.data;
        setAllSharedByYou(rootFiles.filter(f => f.folder && f.shared).map(f => ({ ...f, section: 'shared' })));

        // Shared with you
        const sharedRes = await axios.get(`${api}/api/shared`, {
          headers: { Authorization: `Bearer ${sessionId}` }
        });
        const sharedWithMe = (sharedRes.data.value || sharedRes.data || [])
          .map(f => ({ ...f, section: 'sharedWithMe' }));
        setAllSharedWithMe(sharedWithMe);

        // Root files
        fetchFilesAndFolders(sessionId, null, 'My File', 'root');
      })();
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `${api}/auth/login`;
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const sessionId = localStorage.getItem('sessionId');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.put(`${api}/api/upload`, formData, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      alert('File uploaded!');
      fetchFilesAndFolders(sessionId, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId, currentFolderId);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const sessionId = localStorage.getItem('sessionId');
    const rootFolderName = files[0].webkitRelativePath.split('/')[0];

    // Create folder
    let parentId = null;
    try {
      const res = await axios.post(`${api}/api/create-folder`, { name: rootFolderName }, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      parentId = res.data.id;
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
        await axios.put(`${api}/api/upload`, formData, {
          headers: {
            Authorization: `Bearer ${sessionId}`,
            'Content-Type': 'multipart/form-data',
          }
        });
      } catch (err) {
        alert('Failed to upload file: ' + file.name);
      }
    }
    alert('Folder and files uploaded!');
    fetchFilesAndFolders(sessionId, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId, currentFolderId);
  };

  const folders = files.filter(item => item.folder);
  const documents = files.filter(item => !item.folder);

  const handleShare = async (item) => {
    const emails = prompt('Enter emails to share with (comma-separated):');
    if (!emails) return;
    const role = window.confirm('Give edit permission? (OK for Edit, Cancel for View)')
      ? 'edit' : 'view';
    const sessionId = localStorage.getItem('sessionId');
    try {
      await axios.post(`${api}/api/share`, {
        itemId: item.id,
        emails: emails.split(',').map(e => e.trim()),
        role: role,
        message: ''
      }, {
        headers: {
          Authorization: `Bearer ${sessionId}`,
          'Content-Type': 'application/json',
        }
      });
      alert('Sharing updated!');
      fetchFilesAndFolders(sessionId, currentFolderId, currentFolderName, currentSection, currentRemoteDriveId, currentFolderId);
    } catch (err) {
      alert('Share failed: ' + (err.response?.data?.error || err.message));
    }
  };

  // Corrected: handles shared-with-me subfolder nav with persistent driveId
  const handleFolderClick = (folder) => {
    const sessionId = localStorage.getItem('sessionId');
    // --- Shared with me root nav ---
    if (folder.remoteItem && folder.remoteItem.parentReference && folder.remoteItem.id) {
      fetchFilesAndFolders(
        sessionId,
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
        folder.id,
        folder.name,
        'sharedWithMe',
        currentRemoteDriveId,
        folder.id
      );
    }
    // --- Local folder nav ---
    else {
      fetchFilesAndFolders(sessionId, folder.id, folder.name, currentSection);
    }
  };

  // Sidebar: helper for unique key
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
                    folder.id,
                    folder.name,
                    'sharedWithMe',
                    folder.remoteItem.parentReference.driveId,
                    folder.remoteItem.id
                  );
                } else if (currentRemoteDriveId) {
                  fetchFilesAndFolders(
                    localStorage.getItem('sessionId'),
                    folder.id,
                    folder.name,
                    'sharedWithMe',
                    currentRemoteDriveId,
                    folder.id
                  );
                }
              } else {
                fetchFilesAndFolders(localStorage.getItem('sessionId'), folder.id, folder.name, section);
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
    <div className="app-container" style={{ display: 'flex', minHeight: '100vh', background: '#f7f8fa' }}>
      {/* Sidebar */}
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
                fetchFilesAndFolders(sessionId, null, 'My File', 'root');
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
              <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Shared by You</div>
              {renderSidebarFolders(allSharedByYou, 'shared')}
            </>
          )}
          {allSharedWithMe.length > 0 && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Shared with You</div>
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
                  const sessionId = localStorage.getItem('sessionId');
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
      {/* Main Content */}
      <main style={{ flex: 1, padding: '2.5rem 2.5rem 2.5rem 2rem' }}>
        {/* Top Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 32 }}>
          <input
            type="file"
            ref={folderInputRef}
            style={{ display: 'none' }}
            onChange={handleFolderUpload}
            webkitdirectory="true"
            directory=""
          />
          <button
            style={{ marginRight: 12, background: '#10b981', color: '#fff', fontWeight: 600 }}
            onClick={() => folderInputRef.current.click()}
          >
            + Upload Folder
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            style={{ marginRight: 12, background: '#2563eb', color: '#fff', fontWeight: 600 }}
            onClick={() => fileInputRef.current.click()}
          >
            Upload Document
          </button>
          <button onClick={handleLogin} style={{ background: '#fff', color: '#2563eb', border: '1px solid #2563eb', fontWeight: 600 }}>Login to Microsoft Account</button>
        </div>
        {/* Main Table */}
        <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(16,30,54,0.04)', marginBottom: 32, padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{currentFolderName}</h2>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Documents</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>
                <th style={{ padding: '8px 0' }}>Document Name</th>
                <th>Type</th>
                <th>Sharing</th>
                <th>Web Link</th>
              </tr>
            </thead>
            <tbody>
              {documents.map(doc => (
                <tr key={doc.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 0' }}>{doc.name}</td>
                  <td>{doc.file ? doc.file.mimeType : 'Unknown'}</td>
                  <td>
                    {doc.shared
                      ? (doc.shared.scope === 'organization'
                        ? 'Organization'
                        : doc.shared.scope === 'users'
                          ? 'Shared'
                          : doc.shared.scope === 'anonymous'
                            ? 'Anyone with link'
                            : doc.shared.scope)
                      : 'Private'}
                  </td>
                  <td>{doc.webUrl ? <a href={doc.webUrl} target="_blank" rel="noopener noreferrer">Open</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, marginTop: 32 }}>Folders</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>
                <th style={{ padding: '8px 0' }}>Folder Name</th>
                <th>Sharing</th>
                <th>Web Link</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(folder => (
                <tr key={folder.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td
                    style={{ padding: '8px 0', color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                    onClick={() => handleFolderClick(folder)}
                  >
                    <span
                      style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => handleFolderClick(folder)}
                    >
                      {folder.name}
                    </span>
                  </td>
                  <td>
                    {folder.shared
                      ? (folder.shared.scope === 'organization'
                        ? 'Organization'
                        : folder.shared.scope === 'users'
                          ? 'Shared'
                          : folder.shared.scope === 'anonymous'
                            ? 'Anyone with link'
                            : folder.shared.scope)
                      : 'Private'}
                  </td>
                  <td>{folder.webUrl ? <a href={folder.webUrl} target="_blank" rel="noopener noreferrer">Open</a> : '-'}</td>
                  <td>
                    <button onClick={() => handleShare(folder)}>Share</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default App;
