import { createContext, useState, useContext } from 'react';

// Context to hold application state
const AppContext = createContext();

// Hook for accessing the context
export const useAppContext = () => useContext(AppContext);

// Provider component that wraps the application
export const AppProvider = ({ children }) => {
  // mealPlan state removed in favor of database usage
  const [shoppingList, setShoppingList] = useState({});

  // These are the values that will be available to all components.
  const value = {
    shoppingList,
    setShoppingList,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};