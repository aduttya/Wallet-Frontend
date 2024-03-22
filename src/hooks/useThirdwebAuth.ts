// // hooks/useThirdwebAuth.ts
// import { useState,useCallback } from 'react';
// import axios from 'axios';
// import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
// import {IRelayPKP, SessionSigs } from '@lit-protocol/types';
// import { useAuth } from '../context/AuthContext'; 


// function createAuthPayload(walletAddress, domain, chainId) {
//     const payload = {
//       address: walletAddress,
//       chain_id: chainId,
//       domain: domain,
//       expiration_time: new Date(new Date().getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
//       nonce: generateNonce()
//     };
//     return payload;
//   }
  
//   function generateNonce() {
//     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
//       const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
//       return v.toString(16);
//     });
//   }
    
// function createLoginMessage(payload): string {
//   console.log("the sent payload : ",payload)
//   console.log(payload.domain)
//   console.log(payload.versionField)
//   const typeField = "Ethereum";
//   const header = `${payload.domain} wants you to sign in with your ${typeField} account:`;
//   let prefix = [header, payload.address].join("\n");
//   prefix = [prefix, payload.statement].join("\n\n");
//   if (payload.statement) {
//     prefix += "\n";
//   }

//   const suffixArray = [];
//   if (payload.uri) {
//     const uriField = `URI: ${payload.uri}`;
//     suffixArray.push(uriField);
//   }

//   const versionField = `Version: ${payload.version}`;
//   suffixArray.push(versionField);

//   if (payload.chain_id) {
//     const chainField = `Chain ID: ` + payload.chain_id || "1";
//     suffixArray.push(chainField);
//   }

//   const nonceField = `Nonce: ${payload.nonce}`;
//   suffixArray.push(nonceField);

//   const issuedAtField = `Issued At: ${payload.issued_at}`;
//   suffixArray.push(issuedAtField);

//   const expiryField = `Expiration Time: ${payload.expiration_time}`;
//   suffixArray.push(expiryField);

//   if (payload.invalid_before) {
//     const invalidBeforeField = `Not Before: ${payload.invalid_before}`;
//     suffixArray.push(invalidBeforeField);
//   }

//   if (payload.resources) {
//     suffixArray.push(
//       [`Resources:`, ...payload.resources.map((x) => `- ${x}`)].join("\n"),
//     );
//   }
//   const suffix = suffixArray.join("\n");
//   return [prefix, suffix].join("\n");
// }

// interface LoginProps {
//     currentAccount: IRelayPKP;
//     sessionSigs: SessionSigs;
// }

// const useThirdwebAuth = () => {
//   //const [user, setUser] = useState(null);
//   //const [loading, setLoading] = useState(false);
//   //const [error, setError] = useState(null);

//   const { state, dispatch } = useAuth();
//  // const { user, loading, error } = state;

//   const setLoading = (isLoading: boolean) => {
//     dispatch({ type: 'SET_LOADING', payload: isLoading });
//   };

//   const setError = (err: Error | null) => {
//     dispatch({ type: 'SET_ERROR', payload: err });
//   };

//   const setUser = (userData: any) => { 
//     dispatch({ type: 'SET_USER', payload: userData });
//   };

//   const authenticate = async (data) => {
//     setLoading(true);
//     try {
//       const response = await axios.post('http://localhost:1337/api/auth/payload',data);
//       const payload = response.data.payload;
//       return payload;
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async ({  
//     currentAccount,
//     sessionSigs,
//   }:LoginProps) => {
//     setLoading(true);
//     try {

//       console.log("sessionSigs :",sessionSigs)
//       console.log("currentAccount : ",currentAccount)
//       /**create the wallet */
//       const pkpWallet = new PKPEthersWallet({
//         controllerSessionSigs: sessionSigs,
//         pkpPubKey: currentAccount.publicKey,
//       });
//       await pkpWallet.init();

//       /**create the payload */
//       const data = createAuthPayload(pkpWallet.address,"localhost:3000",1)
//       console.log("data : ",data);

//       const payload = await authenticate(data)
//       console.log("payloadReturnedObject :",payload)

//       const payloadObject = createLoginMessage(payload)
//       console.log("payloadObject : ",payloadObject)

      
//       const signature = await pkpWallet.signMessage(payloadObject)
//       console.log("signature",signature)

//       const data_final = {
//         payload: {
//           payload,signature
//         },
//      }
//      console.log("final data: ",data_final)
//      let _value = JSON.stringify(data_final);
//      let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: 'http://localhost:1337/api/auth/login',
//         headers: { 
//           'Content-Type': 'application/json'
//         },
//         data : _value
//       };

//       try {
//         const response = await axios.request(config);
//         console.log("The token is : ",JSON.stringify(response.data));
//         localStorage.setItem('jwtToken', response.data.token);
//       } catch (error) {
//         console.log(error);
//       }
      
//     //   const response = await axios.post('http://localhost:1337/api/auth/login', {
//     //     payload: {
//     //       payload,
//     //       signature
//     //     }
//     //   });
//      // setUser(response.data.user);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const getUserData = useCallback(async () => {
//     setLoading(true);
//     const token = localStorage.getItem('jwtToken');
//     try {
//       const response = await axios.get('http://localhost:1337/api/auth/user', {
//         headers: {
//           'Authorization': `Bearer ${token}`
//         }
//       });
//       //console.log(response.data)
//       setUser(response.data);
//     } catch (err) {
//       setError(err);
//     } finally {
//       setLoading(false);
//     }
//   }, []);


//   return {
//     user,
//     loading,
//     error,
//     authenticate,
//     login,
//     getUserData,
//     logout
//   };
// };

// export default useThirdwebAuth;
