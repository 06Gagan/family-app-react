import { createContext, useState, useContext } from 'react';

// I created a context to hold my app's state.
const AppContext = createContext();

// This is a hook that my components can use to access the context.
export const useAppContext = () => useContext(AppContext);

// This provider component will wrap my entire app.
export const AppProvider = ({ children }) => {
  // I removed mealPlan from here to rely on the database.
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