import axios from 'axios';

const api = "http://localhost:5001";

export const getRootFiles = async (sessionId) => {
    const res = await axios.get(`${api}/api/files`, {
        headers: { Authorization: `Bearer ${sessionId}` }
    });
    return res.data.value || res.data;
};

export const getFilesById = async (sessionId, folderId) => {
    const res = await axios.get(`${api}/api/files?id=${folderId}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
    });
    return res.data.value || res.data;
};

export const getFilesByRemote = async (sessionId, remoteDriveId, remoteItemId) => {
    const res = await axios.get(`${api}/api/files?remoteDriveId=${remoteDriveId}&remoteItemId=${remoteItemId}`, {
        headers: { Authorization: `Bearer ${sessionId}` }
    });
    return res.data.value || res.data;
};

export const getSharedWithMe = async (sessionId) => {
    const res = await axios.get(`${api}/api/shared`, {
        headers: { Authorization: `Bearer ${sessionId}` }
    });
    return res.data.value || res.data;
};

export const uploadFile = async (sessionId, formData) => {
    await axios.put(`${api}/api/upload`, formData, {
        headers: {
            Authorization: `Bearer ${sessionId}`,
            'Content-Type': 'multipart/form-data',
        }
    });
};

export const createFolder = async (sessionId, name) => {
    const res = await axios.post(`${api}/api/create-folder`, { name }, {
        headers: {
            Authorization: `Bearer ${sessionId}`,
            'Content-Type': 'application/json',
        }
    });
    return res.data.id;
};

export const shareItem = async (sessionId, itemId, emails, role = 'view', message = '') => {
    await axios.post(`${api}/api/share`, {
        itemId,
        emails,
        role,
        message
    }, {
        headers: {
            Authorization: `Bearer ${sessionId}`,
            'Content-Type': 'application/json',
        }
    });
};

// Add more API functions as needed (upload, share, etc.) 