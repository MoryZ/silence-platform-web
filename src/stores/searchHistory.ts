import { ref, watch } from 'vue';

// Maximum number of history items to keep
const MAX_HISTORY_ITEMS = 5;
const STORAGE_KEY = 'silence-config-search-history';

// Create a reactive history array
const history = ref<string[]>([]);

// Load history from localStorage on startup
try {
  const storedHistory = localStorage.getItem(STORAGE_KEY);
  if (storedHistory) {
    history.value = JSON.parse(storedHistory);
  }
} catch (error) {
  console.error('Failed to load search history from localStorage:', error);
}

// Watch for changes and save to localStorage
watch(history, (newHistory) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
}, { deep: true });

// Search history functions
export const useSearchHistory = () => {
  // Add a new search term to history
  const addSearchHistory = (keyword: string) => {
    if (!keyword.trim()) return;
    
    // If keyword already exists, remove it
    const index = history.value.findIndex(item => item === keyword);
    if (index !== -1) {
      history.value.splice(index, 1);
    }
    
    // Add keyword to the beginning
    history.value.unshift(keyword);
    
    // Keep only the most recent items
    if (history.value.length > MAX_HISTORY_ITEMS) {
      history.value = history.value.slice(0, MAX_HISTORY_ITEMS);
    }
  };
  
  // Clear all search history
  const clearSearchHistory = () => {
    history.value = [];
  };
  
  // Remove a specific search history item
  const removeSearchHistory = (index: number) => {
    if (index >= 0 && index < history.value.length) {
      history.value.splice(index, 1);
    }
  };
  
  return {
    history,
    addSearchHistory,
    clearSearchHistory,
    removeSearchHistory
  };
}; 