// src/hooks/useFileUpload.js
import { useState } from 'react';

const useFileUpload = () => {
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');

    const uploadFile = async (file) => {
        if (!file) return null;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', file.type.includes('pdf') ? 'pdf' : 'image');

        setIsLoading(true);
        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/upload-file', true);
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    setUploadProgress((event.loaded / event.total) * 100);
                }
            };
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    setResponseMessage(`Archivo subido: ${data.file_url}`);
                    setUploadProgress(0);
                    setIsLoading(false);
                    return data.file_url;
                } else {
                    setResponseMessage(JSON.parse(xhr.responseText).message);
                    setUploadProgress(0);
                    setIsLoading(false);
                    return null;
                }
            };
            xhr.onerror = () => {
                setResponseMessage('Error al subir archivo');
                setUploadProgress(0);
                setIsLoading(false);
                return null;
            };
            xhr.withCredentials = true;
            xhr.send(formData);

            return new Promise((resolve) => {
                xhr.onloadend = () => resolve(xhr.status === 200 ? JSON.parse(xhr.responseText).file_url : null);
            });
        } catch {
            setResponseMessage('Error al subir archivo');
            setUploadProgress(0);
            setIsLoading(false);
            return null;
        }
    };

    return { uploadFile, uploadProgress, isLoading, responseMessage, setResponseMessage };
};

export default useFileUpload;