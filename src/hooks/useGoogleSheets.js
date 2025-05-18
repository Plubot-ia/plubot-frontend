// hooks/useGoogleSheets.js
import { useState, useEffect } from 'react';
import useAPI from './useAPI';
import useAuthStore from '@/stores/useAuthStore';

const useGoogleSheets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sheetsData, setSheetsData] = useState(null);
  const { axiosInstance } = useAPI();
  const { user } = useAuthStore();

  const connectGoogleSheets = async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/api/integrations/google/sheets/connect', {
        user_id: user.id,
        credentials: credentials
      });
      
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al conectar con Google Sheets');
      setLoading(false);
      throw err;
    }
  };

  const fetchSheetData = async (spreadsheetId, range = 'A1:Z1000') => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/api/integrations/google/sheets/data', {
        user_id: user.id,
        spreadsheet_id: spreadsheetId,
        range: range
      });
      
      setSheetsData(response.data);
      setLoading(false);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Error al obtener datos de Google Sheets');
      setLoading(false);
      throw err;
    }
  };

  return {
    loading,
    error,
    sheetsData,
    connectGoogleSheets,
    fetchSheetData
  };
};

export default useGoogleSheets;