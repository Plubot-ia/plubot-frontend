export const useNodeHistory = () => {
    const addToHistory = (nodeId, historyEntry) => {
      console.log(`Adding to history for node ${nodeId}`, historyEntry);
    };
  
    const getHistory = (nodeId) => {
      console.log(`Fetching history for node ${nodeId}`);
      return [];
    };
  
    return { addToHistory, getHistory };
  };