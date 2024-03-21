import React, { createContext, useContext, useReducer, Dispatch ,ReactNode} from 'react';

type AuthState = {
  user: any; // Replace 'any' with the correct type for your user data
  loading: boolean;
  error: Error | null;
};

type AuthAction =
  | { type: 'SET_USER'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'LOGOUT' };

type AuthContextType = {
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
  logout: () => void;
};

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
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
    case 'LOGOUT':
      return {
        ...state,
        user: null,
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
    
    const logout = () => {
      console.log("The logout")
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('authMethod')
      dispatch({ type: 'LOGOUT' });
    };
  
  const value = {
    state,
    dispatch,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

//export const useAuth = (): AuthContextType => useContext(AuthContext);
export const useAuth = (): AuthContextType & { logout: () => void } => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return { ...context, logout: context.logout };
};
