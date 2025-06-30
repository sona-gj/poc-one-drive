import { useEffect, useState, useRef } from 'react';
import './App.css';
import axios from 'axios';

function App() {
  const api = "http://localhost:5001";
  const [files, setFiles] = useState([]);
  const [sharedFolders, setSharedFolders] = useState([]);
  const fileInputRef = useRef();

  // Fetch files & shared folders
  const fetchFilesAndFolders = async (sessionId) => {
    try {
      // Files & folders
      const filesRes = await axios.get(`${api}/api/files`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      setFiles(filesRes.data.value || filesRes.data);

      // Shared folders
      const sharedRes = await axios.get(`${api}/api/shared`, {
        headers: { Authorization: `Bearer ${sessionId}` }
      });
      const shared = (sharedRes.data.value || sharedRes.data || []).filter(item => item.folder);
      setSharedFolders(shared);
    } catch (err) {
      setFiles([]);
      setSharedFolders([]);
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('sessionId') || localStorage.getItem('sessionId');
    if (sessionId) {
      localStorage.setItem('sessionId', sessionId);
      window.history.replaceState({}, document.title, "/");
      fetchFilesAndFolders(sessionId);
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
      fetchFilesAndFolders(sessionId);
    } catch (err) {
      alert('Upload failed: ' + (err.response?.data?.error || err.message));
    }
  };

  const folderInputRef = useRef();

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
      parentId = res.data.id; // The ID of the newly created folder
    } catch (err) {
      alert('Failed to create folder in OneDrive');
      return;
    }

    // 2. Upload all files, keeping their folder structure
    for (const file of files) {
      // Remove the root folder name from the path to get the relative path inside the new OneDrive folder
      const relativePath = file.webkitRelativePath.replace(rootFolderName + '/', '');
      // For now, let's upload all files directly to the root folder.
      // To preserve folder structure, you'd need to create subfolders as needed (advanced).
      const formData = new FormData();
      formData.append('file', file);
      formData.append('parentId', parentId);
      // Optionally add the path to backend for advanced logic
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
    fetchFilesAndFolders(sessionId); // Refresh
  };


  // Split files into folders and documents
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
      fetchFilesAndFolders(sessionId); // Refresh list
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
            <div style={{ color: '#2563eb', fontWeight: 600, marginBottom: 8 }}>● Recent</div>
            <div style={{ color: '#6b7280', marginBottom: 8 }}>☆ Favorites</div>
            <div style={{ color: '#6b7280', marginBottom: 8 }}>🗂 My File</div>
            <div style={{ color: '#6b7280', marginBottom: 24 }}>🗑 Recycle bin</div>
          </div>
          {sharedFolders.length > 0 && (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Shared Folders</div>
              {sharedFolders.map(folder => (
                <div key={folder.id} style={{ color: '#6b7280', marginLeft: 16, marginBottom: 8 }}>
                  📁 {folder.name}
                </div>
              ))}
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
        {/* Recent Documents */}
        <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(16,30,54,0.04)', marginBottom: 32, padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Recent Documents</h2>
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
        </section>

        {/* Recent Folders */}
        <section style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 2px rgba(16,30,54,0.04)', padding: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Recent Folders</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#6b7280', fontWeight: 600 }}>
                <th style={{ padding: '8px 0' }}>Folder Name</th>
                <th>Sharing</th>
                <th>Web Link</th>
              </tr>
            </thead>
            <tbody>
              {folders.map(folder => (
                <tr key={folder.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '8px 0' }}>{folder.name}</td>
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
