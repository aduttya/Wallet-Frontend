import { AuthMethod, IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { ethers } from 'ethers';
import { useState } from 'react';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import { useRouter } from 'next/router';
import { useDisconnect } from 'wagmi';
import { AuthMethodType } from '@lit-protocol/constants';
import { checkAndSignAuthMessage, LitNodeClient } from '@lit-protocol/lit-node-client';
import { litNodeClient,litAuthClient } from '../utils/lit';
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, polygonMumbai,createSmartAccountClient,SmartAccountSigner,Address } from "@alchemy/aa-core";
import { createMultiOwnerModularAccount } from "@alchemy/aa-accounts";
import {authenticateWithGoogle,DOMAIN,ORIGIN} from '../utils/lit';

import { http } from "viem";
import axios from 'axios';
import dotenv from 'dotenv'
import { LitAuthMethod,LitSigner} from "@alchemy/aa-signers/lit-protocol";
//import { LitSigner } from "@alchemy/aa-signers";
import useAuthenticate from '../hooks/useAuthenticate';
import { useAuth } from '../context/AuthContext'; // Adjust the import path as needed

import { encodeFunctionData,keccak256 } from "viem";
import { LitAuthClient, isSignInRedirect,GoogleProvider } from '@lit-protocol/lit-auth-client';
import { AuthMethodScope, ProviderType } from '@lit-protocol/constants';
import useThirdwebAuth from '../hooks/useThirdwebAuth';

//const signer = LocalAccountSigner.privateKeyToAccountSigner(process.env.PRIVATE_KEY);


const redirectUri = ORIGIN + '/login';

interface DashboardProps {
  currentAccount: IRelayPKP;
  sessionSigs: SessionSigs;
  authMethod:AuthMethod
}

const transferABI = [
  {
    "constant": false,
    "inputs": [
      {
        "name": "_to",
        "type": "address"
      },
      {
        "name": "_value",
        "type": "uint256"
      }
    ],
    "name": "transfer",
    "outputs": [
      {
        "name": "",
        "type": "bool"
      }
    ],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [
        {
            "name": "_owner",
            "type": "address"
        }
    ],
    "name": "balanceOf",
    "outputs": [
        {
            "name": "balance",
            "type": "uint256"
        }
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
}
]

export const chain = polygonMumbai;
const rpcTransport = http("https://polygon-mumbai.g.alchemy.com/v2/iZDtkSlQWHXN8af_yP2u2RuhBDrKzoDH");
const url = "https://polygon-mumbai.g.alchemy.com/v2/iZDtkSlQWHXN8af_yP2u2RuhBDrKzoDH";


export default function Dashboard({
  currentAccount,
  sessionSigs,
  authMethod
}: DashboardProps) {

  const { state, logout } = useAuth(); // Destructure `state` and `logout` from the hook
  const { loggedIn } = state; // Destructure `user` from the `state` object
  const userData = state.userData;

  console.log("Is logged in Dashboard : ?",loggedIn)
  if(loggedIn){
    console.log("user data in Dashboard : ",userData)
  }
  const [message, setMessage] = useState<string>('Free the web!');
  const [signature, setSignature] = useState<string>();
  const [recoveredAddress, setRecoveredAddress] = useState<string>();
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  const { disconnectAsync } = useDisconnect();
  const router = useRouter();
  const handleLogout = () => {
    logout();
    router.push('/'); // Redirect to the login page
  };


function createAuthPayload(walletAddress, domain, chainId) {
    const payload = {
      address: walletAddress,
      chain_id: chainId,
      domain: domain,
      expiration_time: new Date(new Date().getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes from now
      nonce: generateNonce()
    };
    return payload;
  }
  
  function generateNonce() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
    
const redirectUri = ORIGIN + '/login';

function createLoginMessage(payload): string {
  console.log("the sent payload : ",payload)
  console.log(payload.domain)
  console.log(payload.versionField)
  const typeField = "Ethereum";
  const header = `${payload.domain} wants you to sign in with your ${typeField} account:`;
  let prefix = [header, payload.address].join("\n");
  prefix = [prefix, payload.statement].join("\n\n");
  if (payload.statement) {
    prefix += "\n";
  }

  const suffixArray = [];
  if (payload.uri) {
    const uriField = `URI: ${payload.uri}`;
    suffixArray.push(uriField);
  }

  const versionField = `Version: ${payload.version}`;
  suffixArray.push(versionField);

  if (payload.chain_id) {
    const chainField = `Chain ID: ` + payload.chain_id || "1";
    suffixArray.push(chainField);
  }

  const nonceField = `Nonce: ${payload.nonce}`;
  suffixArray.push(nonceField);

  const issuedAtField = `Issued At: ${payload.issued_at}`;
  suffixArray.push(issuedAtField);

  const expiryField = `Expiration Time: ${payload.expiration_time}`;
  suffixArray.push(expiryField);

  if (payload.invalid_before) {
    const invalidBeforeField = `Not Before: ${payload.invalid_before}`;
    suffixArray.push(invalidBeforeField);
  }

  if (payload.resources) {
    suffixArray.push(
      [`Resources:`, ...payload.resources.map((x) => `- ${x}`)].join("\n"),
    );
  }
  const suffix = suffixArray.join("\n");
  return [prefix, suffix].join("\n");
}



  /**
   * Sign a message with current PKP
   */
  async function signMessageWithPKP() {
    setLoading(true);

    try {

      const pkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: currentAccount.publicKey,
      });
      await pkpWallet.init();

      console.log(sessionSigs)
      //console.log(pkpWallet)
      const _signature = await pkpWallet.signMessage(message);
      console.log("The signature is :",_signature)
      console.log("address :",pkpWallet.address)
      pkpWallet.setChainId(80001);
      
      const litSigner = new LitSigner<LitAuthMethod>({
        pkpPublicKey: pkpWallet.publicKey,
        rpcUrl: url,
        network: "cayenne"
      });

      const auth = {
        authMethodType: authMethod.authMethodType,
        accessToken: authMethod.accessToken
      };

      await litSigner.authenticate({        
        context: sessionSigs,
      })
//       console.log("The lit signer object : ",litSigner)
       const address = await litSigner.getAddress();
       console.log("Lit signer address : ",address)

       const litSignerSignedMessage = await litSigner.signMessage("Hello World!");
        console.log("litSignerSignedMessage : ",litSignerSignedMessage)

        
        let authDetails = await litSigner.getAuthDetails();
        console.log("authDetails : ",authDetails)

        const smartAccountClient = await createModularAccountAlchemyClient({
        apiKey: `iZDtkSlQWHXN8af_yP2u2RuhBDrKzoDH`,
        chain,
        signer: litSigner,
        // gasManagerConfig: {
        //   policyId: "00f72535-0323-4f28-93ce-53bd09492b5e",
        // },      
      });
       

       console.log("Smart Contract Account : ",await smartAccountClient.getAddress())
      
      
       const signedMessage = await smartAccountClient.signMessage({ message: "msg" });
       console.log("Signed message : ",signedMessage)
 // const signature = await signEIP712(domain, types, jobInfo);

    const uoCallData = encodeFunctionData({
      abi: transferABI,
      functionName: "transfer",
      args: ["0x725b35D35eDE4157ebE5a57613609d40C4DB6aB7",'2000000'],
    });
    // const uoCallData = encodeFunctionData({
    //   abi: transferABI,
    //   functionName: "balanceOf",
    //   args: ["0x725b35D35eDE4157ebE5a57613609d40C4DB6aB7"],
    // });

    if (!uoCallData.startsWith('0x')) {
      throw new Error('Invalid call data format');
    }

    // const transaction = {
    //   from: pkpWallet.address,
    //   to: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
    //   data: uoCallData,
    //   // Optional: Specify gasPrice and gasLimit if desired
    // };
    // await pkpWallet.setRpc(url)
    // console.log("The Account balance : ",await pkpWallet.getBalance())
    // const signedTransactionRequest = await pkpWallet.signTransaction(
    //   transaction
    // );    
    // const tx = await pkpWallet.sendTransaction(signedTransactionRequest)
    // console.log(tx)

    // const elligibility = await smartAccountClient.checkGasSponsorshipEligibility({
    //     target: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97",
    //     data: uoCallData,
      
    // });



    //console.log("gas policy eligibility : ",elligibility)
    
    
  //  console.log(`User Operation is ${elligibility ? "eligible" : "ineligible"} for gas sponsorship`);
    // const uoSimResult = await smartAccountClient.simulateUserOperation({
    //   uo: uoCallData,
    // });
    
    // if (uoSimResult.error) {
    //   console.error(uoSimResult.error.message);
    // }
    
    const overrides = { paymasterAndData: "0x" };
    const vitalikAddress =
    "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
  // Send a user operation from your smart account to Vitalik that does nothing
  const { hash: uoHash } = await smartAccountClient.sendUserOperation({
    uo: {
      target: vitalikAddress, // The desired target contract address
      data: "0x", // The desired call data
      value: 1n, // (Optional) value to send the target contract address
    },
  });

  console.log("UserOperation Hash: ", uoHash); // Log the user operation hash

  // Wait for the user operation to be mined
  const txHash = await smartAccountClient.waitForUserOperationTransaction({
    hash: uoHash,
  });

  // console.log("txHash : ",txHash)
  //   let uo:any;
  //   try{
  //   uo = await smartAccountClient.sendUserOperation({
  //     uo:{
  //       target: "0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97",
  //       data: uoCallData,
  //     },
  //   });

  // }catch(err){
  //   console.log(err)
  // }
  
  //   const txHash = await smartAccountClient.waitForUserOperationTransaction(uo);
  //   console.log(txHash);
  
      /**generate the payload */
      // const data = createAuthPayload(pkpWallet.address,"localhost:3000",1)

      // /**call the backend auth*/
      // try{
      //   const response = await axios.post('http://localhost:1337/api/auth/payload', data);
      //   console.log('Payload Response from Server :', response.data);
      //   //response.data.payload.chain = "80001"; // You can set this to the desired chain value

      //   console.log('Updated Payload Response from Server :', response.data);

      //   /**if the payload is successful sign the response and send it back to backend for login*/
      //   const payloadObject = createLoginMessage(response.data.payload)
      //   console.log("The login message : ",payloadObject)
      //   // const payload =  {
      //   //   type: "Ethereum",
      //   //   domain: "example.com",
      //   //   address: pkpWallet.address,
      //   //   statement: "Sign in to Example.com",
      //   //   uri: "https://example.com/login",
      //   //   version: "1",
      //   //   chain_id: "1",
      //   //   nonce: generateNonce(),
      //   //   issued_at: new Date().toISOString(),
      //   //   expiration_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      //   //   invalid_before: new Date().toISOString(),
      //   //   resources: ["https://example.com/profile"],
      //   // }
      //   const signature = await pkpWallet.signMessage(payloadObject)
      //   const payload = response.data.payload
      //   console.log("The payload object is : ",response.data)
      //   const data_final = {
      //       payload: {
      //         payload,signature
      //       },
      //    }
      //    console.log("The final object is : ",data_final)
      //    //console.log("The verification : ",ethers.utils.verifyMessage(payloadObject,signature))

      //   const test = {
      //     "payload":{
      //     "payload":{
      //     "type":"evm",
      //     "domain":"localhost:1337",
      //     "address":"0xbE9c3578964C0FB32Da4DE76b73D5D289D0f54c4",
      //     "statement":"Please ensure that the domain above matches the URL of the current website.",
      //     "version":"1",
      //     "chain_id":"80001",
      //     "nonce":"945d864a-bb05-4956-b2b4-0735cc920f11",
      //     "issued_at":"2024-03-19T10:36:20.916Z",
      //     "expiration_time":"2024-03-19T11:09:44.950Z",
      //     "invalid_before":"2024-03-19T10:49:44.950Z"
      //     },
      //     "signature":"0x272054bb9aa8dbfa04d4dde6bdbac09b9f2304e5889ab56759e203a3490259ce7447c6a94623608055ce21b25dae985f6611f4bf9514b1e71604e59a8abb05391b"
      //     }
      //     }

      //   console.log("The hardcoded value : ",test)
      //   /**send the msg to server for login */
      //   let _value = JSON.stringify(data_final);
      //   // let config = {
      //   //   method: 'post',
      //   //   maxBodyLength: Infinity,
      //   //   url: 'http://localhost:1337/api/auth/login',
      //   //   headers: { 
      //   //     'Content-Type': 'application/json'
      //   //   },
      //   //   data : _value
      //   // };
      //   // axios.request(config)
      //   // .then((response) => {
      //   //   console.log(JSON.stringify(response.data));
      //   // })
      //   // .catch((error) => {
      //   //   console.log(error);
      //   // });
      //   // try {
      //   //   const response = await axios.request(config);
      //   //   console.log("JWT Token:", response.data.token);

      //   //   /**save the token to local storage */
      //   //   localStorage.setItem('jwtToken', response.data.token);
      //   //   //return response.data.token;
      //   // } catch (error) {
      //   //   console.error(error);
      //   // }
      //   // const token = localStorage.getItem('jwtToken');
      //   // console.log("token : ",token)
      //   //  const updated_config = {
      //   //   method: 'post',
      //   //   maxBodyLength: Infinity,
      //   //   url: 'http://localhost:1337/api/auth/logout',
      //   //   headers: { 
      //   //     'Content-Type': 'application/json',
      //   //     'Authorization': `Bearer ${token}`
      //   //   },
      //   // };
      //   //  try {
      //   //   const response = await axios.request(updated_config);
      //   //   console.log("Logout response :", response.data);

      //   //   /**save the token to local storage */
      //   //   localStorage.removeItem('jwtToken');
      //   //   //return response.data.token;
      //   // } catch (error) {
      //   //   console.error(error);
      //   // }

      //   /**try to access data after logout */
      //   // try {
      //   //   const response = await axios.get('http://localhost:1337/api/auth/user', {
      //   //     headers: {
      //   //       'Authorization': `Bearer ${token}`
      //   //     }
      //   //   });
      //   //   console.log('User data from server:', response.data);
      //   // } catch (err) {
      //   //   console.error('Error fetching user data:', err);
      //   // }
        
      // //   try{
      // //     const login_response = await axios.post('http://localhost:1337/api/auth/login',test);
      // //    console.log('login Response from Server :', login_response.data);
      // //  }catch(err){console.log(err)}

      // }catch(err){console.log(err)}

      setSignature(_signature);

      // Get the address associated with the signature created by signing the message
      const recoveredAddr = ethers.utils.verifyMessage(message, _signature);
      setRecoveredAddress(recoveredAddr);

      // Check if the address associated with the signature is the same as the current PKP
      const verified =
        currentAccount.ethAddress.toLowerCase() === recoveredAddr.toLowerCase();
      setVerified(verified);
    } catch (err) {
      console.error(err);
      setError(err);
    }

    setLoading(false);
  }

  // async function handleLogout() {
  //   try {
  //     await disconnectAsync();
  //   } catch (err) {}
  //   localStorage.removeItem('lit-wallet-sig');
  //   router.reload();
  // }

  return (
    <div className="container">
      <div className="logout-container">
        <button className="btn btn--link" onClick={handleLogout}>
          Logout
        </button>
      </div>
      <h1>Ready for the open web</h1>
      <div className="details-card">
        <p>My address: {currentAccount.ethAddress.toLowerCase()}</p>
      </div>
      <div className="divider"></div>
      <div className="message-card">
        <p>Test out your wallet by signing this message:</p>
        <p className="message-card__prompt">{message}</p>
        <button
          onClick={signMessageWithPKP}
          disabled={loading}
          className={`btn ${
            signature ? (verified ? 'btn--success' : 'btn--error') : ''
          } ${loading && 'btn--loading'}`}
        >
          {signature ? (
            verified ? (
              <span>Verified ✓</span>
            ) : (
              <span>Failed x</span>
            )
          ) : (
            <span>Sign message</span>
          )}
        </button>
        
      </div>
    </div>
  );
}
