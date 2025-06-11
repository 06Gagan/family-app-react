import { useState } from 'react';
import { AppContext } from './AppContext.js';

// Provider component that wraps the application
const AppProvider = ({ children }) => {
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

export default AppProvider;
