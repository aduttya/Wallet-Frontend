import React, { createContext, useContext, useReducer, Dispatch, ReactNode } from 'react';
import { useRouter } from 'next/router';
import useAccounts from '../hooks/useAccounts';

type AuthState = {
  loggedIn: boolean; 
  loading: boolean;
  error: Error | null;
  userData: any | null; // Add this line

};

export type AuthAction =
  | { type: 'SET_LOGGED_IN'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER_DATA'; payload: any | null } 
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'LOGOUT' };

type AuthContextType = {
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
  logout: () => void;
};

const initialState: AuthState = {
  loggedIn: false,
  loading: false,
  error: null,
  userData: null, // Add this line
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOGGED_IN':
      return {
        ...state,
        loggedIn: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_USER_DATA': // Add this case
      return {
        ...state,
        userData: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        loggedIn: false,
        userData: null, // Clear user data on logout
      };
    default:
      return state;
  }
};

const AuthContext = createContext<AuthContextType>({
  state: initialState,
  dispatch: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);
    const router = useRouter();
    const logout = () => {
      console.log("The logout");
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('authMethod');
      dispatch({ type: 'LOGOUT' });
    };
  
    const value = {
      state,
      dispatch,
      logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType & { logout: () => void } => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return { ...context, logout: context.logout };
};
