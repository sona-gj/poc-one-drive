import { useEffect, useState, useRef } from 'react';
import './App.css';
import axios from 'axios';

// Recursive sidebar for folders (supports future nested structure)
function SidebarFolders({ folders, currentFolderId, onSelect, section }) {
  if (!folders.length) return null;
  return (
    <ul style={{ listStyle: "none", paddingLeft: 0 }}>
      {folders.map(folder => (
        <li key={folder.id || folder.name}>
          <div
            style={{
              marginLeft: 16,
              marginBottom: 8,
              color: currentFolderId === folder.id && section === folder.section ? '#2563eb' : '#6b7280',
              fontWeight: currentFolderId === folder.id && section === folder.section ? 700 : 400,
              cursor: 'pointer',
              borderLeft: currentFolderId === folder.id && section === folder.section ? '2px solid #2563eb' : '2px solid transparent',
              paddingLeft: 8,
              background: currentFolderId === folder.id && section === folder.section ? '#eef3fd' : 'transparent'
            }}
            onClick={() => onSelect(folder, section)}
          >
            📁 {folder.name}
          </div>
          {folder.children && folder.children.length > 0 && (
            <SidebarFolders
              key={folder.id + "_children"}
              folders={folder.children}
              currentFolderId={currentFolderId}
              onSelect={onSelect}
              section={section}
            />
          )}
        </li>
      ))}
    </ul>
  );
}


function App() {
  const api = "http://localhost:5001";
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef();
  const folderInputRef = useRef();

  // Navigation state
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [currentFolderName, setCurrentFolderName] = useState('My File');
  const [currentSection, setCurrentSection] = useState('root');
  const [rootFolders, setRootFolders] = useState([]);

  // Fetch files & shared folders
  const fetchFilesAndFolders = async (sessionId, folderId = null, folderName = 'My File', section = 'root') => {
    try {
      // Fetch files for given folder (or root if null)
      const url = folderId
        ? `${api}/api/files?id=${folderId}`
        : `${api}/api/files`;
      const filesRes = await axios.get(url, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      setFiles(filesRes.data.value || filesRes.data);
      setCurrentFolderId(folderId);
      setCurrentFolderName(folderName);
      setCurrentSection(section);
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
      fetchFilesAndFolders(sessionId, null, 'My File', 'root');
    }
  }, []);

  const handleLogin = () => {
    window.location.href = `${api}/auth/login`;
  };

  // --- Upload File ---
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
      fetchFilesAndFolders(sessionId, currentFolderId, currentFolderName, currentSection);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleFolderUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const sessionId = localStorage.getItem('sessionId');
    const rootFolderName = files[0].webkitRelativePath.split('/')[0];

    // 1. Create the root folder in OneDrive
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

    // 2. Upload all files
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
    fetchFilesAndFolders(sessionId, currentFolderId, currentFolderName, currentSection);
  };

  // Split files into folders and documents
  const folders = files.filter(item => item.folder);
  const documents = files.filter(item => !item.folder);
  // Shared folders for sidebar: those in current folder with a 'shared' property
  const sharedFolders = folders.filter(folder => folder.shared).map(f => ({ ...f, section: 'shared' }));

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
      fetchFilesAndFolders(sessionId, currentFolderId, currentFolderName, currentSection);
    } catch (err) {
      alert('Share failed: ' + (err.response?.data?.error || err.message));
    }
  };

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
          {/* Shared Folders from current folder */}
          {sharedFolders.length > 0 && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 16 }}>Shared Folders</div>
              <SidebarFolders
                folders={sharedFolders}
                currentFolderId={currentFolderId}
                onSelect={(folder) => {
                  const sessionId = localStorage.getItem('sessionId');
                  fetchFilesAndFolders(sessionId, folder.id, folder.name, 'shared');
                }}
                section="shared"
              />
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
        {/* Search and Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
          <input type="text" placeholder="Search" style={{ flex: 1, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb' }} />
          <button style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, padding: '0 16px' }}>Date</button>
          <button style={{ border: '1px solid #e5e7eb', background: '#fff', borderRadius: 6, padding: '0 16px' }}>Document Type</button>
        </div>

        {/* Main Table */}
        <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(16,30,54,0.04)', marginBottom: 32, padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>{currentFolderName}</h2>
          {/* Documents */}
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>Recent Documents</h3>
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

          {/* Folders */}
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, marginTop: 32 }}>Recent Folders</h3>
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
                    onClick={() => {
                      const sessionId = localStorage.getItem('sessionId');
                      fetchFilesAndFolders(sessionId, folder.id, folder.name, currentSection);
                    }}
                  >
                    {folder.name}
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
