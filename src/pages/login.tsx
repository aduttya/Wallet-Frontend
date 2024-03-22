import { useEffect } from 'react';
import { useRouter } from 'next/router';
import useAuthenticate from '../hooks/useAuthenticate';
import useSession from '../hooks/useSession';
import useAccounts from '../hooks/useAccounts';
import { ORIGIN, signInWithDiscord, signInWithGoogle,getProviderByAuthMethod } from '../utils/lit';
import Dashboard from '../components/Dashboard';
import Loading from '../components/Loading';
import LoginMethods from '../components/LoginMethods';
import AccountSelection from '../components/AccountSelection';
import CreateAccount from '../components/CreateAccount';
import { litNodeClient,litAuthClient } from '../utils/lit';
import {
  authenticateWithGoogle,
  authenticateWithDiscord,
  authenticateWithEthWallet,
  authenticateWithWebAuthn,
  authenticateWithStytch,
} from '../utils/lit';
import { login } from '../utils/login';
//import useThirdwebAuth from '../hooks/useThirdwebAuth';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginView() {


  const redirectUri = ORIGIN + '/login';

  const {
    authMethod,
    setAuthMethod,
    authWithEthWallet,
    authWithWebAuthn,
    authWithStytch,
    loading: authLoading,
    error: authError,
  } = useAuthenticate(redirectUri);
  const {
    fetchAccounts,
    setCurrentAccount,
    currentAccount,
    accounts,
    loading: accountsLoading,
    error: accountsError,
  } = useAccounts();
  const {
    initSession,
    sessionSigs,
    loading: sessionLoading,
    error: sessionError,
  } = useSession();

  //const {getUserData,login} = useThirdwebAuth();
  const { dispatch,state } = useAuth();
  const {loggedIn} = state
  const userData = state.userData;

  
  const router = useRouter();

  console.log("user data in login.tsx : ",userData)

  const error = authError || accountsError || sessionError;

  /**Console test section */
  
  async function handleGoogleLogin() {
    await signInWithGoogle(redirectUri);
  }

  async function handleDiscordLogin() {
    await signInWithDiscord(redirectUri);
  }

  function goToSignUp() {
    router.push('/');
  }

  //console.log("Auth value {}: ",authMethod)
  // const [loginAttempted, setLoginAttempted] = useState(false);
  // useEffect(() => {
  //   if (currentAccount && sessionSigs && !loginAttempted) {
  //     login({ currentAccount, sessionSigs });
  //    getUserData()
  //     setLoginAttempted(true);
  //   }
  // }, [currentAccount, sessionSigs, login, loginAttempted]);
  
  useEffect(() => {
    const storedAuthMethod = localStorage.getItem('authMethod');
    if (storedAuthMethod) {
      setAuthMethod(JSON.parse(storedAuthMethod));
    }
  }, [setAuthMethod]);

  // useEffect(() => {
  //   getUserData();
  // }, [getUserData]);

  // if(authMethod){
  //     const provider = getProviderByAuthMethod(authMethod)
  //     console.log("The provider is : ",provider)
  // }

  useEffect(() => {
    // If user is authenticated, fetch accounts
    if (authMethod) {
      //console.log("user is authenticated, fetch accounts : ",authMethod)
      router.replace(window.location.pathname, undefined, { shallow: true });
      fetchAccounts(authMethod);
    }
  }, [authMethod, fetchAccounts]);

  useEffect(() => {
    // If user is authenticated and has selected an account, initialize session
    if (authMethod && currentAccount) {
      //console.log("user is authenticated, init session")
      initSession(authMethod, currentAccount);
    }
  }, [authMethod, currentAccount, initSession]);

  const [loginAttempted, setLoginAttempted] = useState(false);

useEffect(() => {
  // If session signatures are available and login hasn't been attempted yet, proceed with login
  if (sessionSigs && currentAccount && !loginAttempted) {
    const jwtToken = localStorage.getItem('jwtToken');

    const performLogin = async () => {
      try {
        await login({ currentAccount, sessionSigs }, dispatch);
        setLoginAttempted(true); // Mark login as attempted
      } catch (error) {
        console.error('Login error:', error);
        // Handle login error (e.g., set an error state)
      }
    };
    if(!jwtToken){
      performLogin();
    }else{
      console.log("user is already logged with thirdweb")
    }
  }
}, [sessionSigs, currentAccount, login, loginAttempted]);

  if (authLoading) {
    return (
      <Loading copy={'Authenticating your credentials...'} error={error} />
    );
  }

  if (accountsLoading) {
    return <Loading copy={'Looking up your accounts...'} error={error} />;
  }

  if (sessionLoading) {
    return <Loading copy={'Securing your session...'} error={error} />;
  }

  // If user is authenticated and has selected an account, initialize session
  if (currentAccount && sessionSigs) {
    return (
      <Dashboard currentAccount={currentAccount} sessionSigs={sessionSigs} authMethod = {authMethod}/>
    );
  }

  // If user is authenticated and has more than 1 account, show account selection
  if (authMethod && accounts.length > 0) {
    return (
      <AccountSelection
        accounts={accounts}
        setCurrentAccount={setCurrentAccount}
        error={error}
      />
    );
  }

  // If user is authenticated but has no accounts, prompt to create an account
  if (authMethod && accounts.length === 0) {
    return <CreateAccount signUp={goToSignUp} error={error} />;
  }
  // If user is not authenticated, show login methods
  return (
    <LoginMethods
      handleGoogleLogin={handleGoogleLogin}
      handleDiscordLogin={handleDiscordLogin}
      authWithEthWallet={authWithEthWallet}
      authWithWebAuthn={authWithWebAuthn}
      authWithStytch={authWithStytch}
      signUp={goToSignUp}
      error={error}
    />
  );
}
