// hooks/useGoogleSheets.js
import { useState } from 'react';

import useAuthStore from '@/stores/use-auth-store';

import useAPI from './useAPI';

const useGoogleSheets = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState();
  const [sheetsData, setSheetsData] = useState();
  const { axiosInstance } = useAPI();
  const { user } = useAuthStore();

  const connectGoogleSheets = async (credentials) => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await axiosInstance.post('integrations/google/sheets/connect', {
        user_id: user.id,
        credentials,
      });

      setLoading(false);
      return response.data;
    } catch (error_) {
      setError(error_.response?.data?.error ?? 'Error al conectar con Google Sheets');
      setLoading(false);
      throw error_;
    }
  };

  const fetchSheetData = async (spreadsheetId, range = 'A1:Z1000') => {
    setLoading(true);
    setError(undefined);

    try {
      const response = await axiosInstance.post('integrations/google/sheets/data', {
        user_id: user.id,
        spreadsheet_id: spreadsheetId,
        range,
      });

      setSheetsData(response.data);
      setLoading(false);
      return response.data;
    } catch (error_) {
      setError(error_.response?.data?.error ?? 'Error al obtener datos de Google Sheets');
      setLoading(false);
      throw error_;
    }
  };

  return {
    loading,
    error,
    sheetsData,
    connectGoogleSheets,
    fetchSheetData,
  };
};

export default useGoogleSheets;
