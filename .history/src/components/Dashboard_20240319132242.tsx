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
import { LocalAccountSigner, polygonMumbai,createSmartAccountClient,SmartAccountSigner } from "@alchemy/aa-core";
import { createMultiOwnerModularAccount } from "@alchemy/aa-accounts";
import {authenticateWithGoogle,DOMAIN,ORIGIN} from '../utils/lit';

import { http } from "viem";
import axios from 'axios';
import dotenv from 'dotenv'
import { LitAuthMethod,LitSigner} from "@alchemy/aa-signers/lit-protocol";
//import { LitSigner } from "@alchemy/aa-signers";

import { encodeFunctionData,keccak256 } from "viem";
import { LitAuthClient, isSignInRedirect,GoogleProvider } from '@lit-protocol/lit-auth-client';
import { AuthMethodScope, ProviderType } from '@lit-protocol/constants';


interface DashboardProps {
  currentAccount: IRelayPKP;
  sessionSigs: SessionSigs;
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
  }
]

export const chain = polygonMumbai;
const rpcTransport = http("https://polygon-mumbai.g.alchemy.com/v2/iZDtkSlQWHXN8af_yP2u2RuhBDrKzoDH");
const url = "https://polygon-mumbai.g.alchemy.com/v2/iZDtkSlQWHXN8af_yP2u2RuhBDrKzoDH";
export default function Dashboard({
  currentAccount,
  sessionSigs,
}: DashboardProps) {
  const [message, setMessage] = useState<string>('Free the web!');
  const [signature, setSignature] = useState<string>();
  const [recoveredAddress, setRecoveredAddress] = useState<string>();
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  const { disconnectAsync } = useDisconnect();
  const router = useRouter();


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

      console.log(pkpWallet)
      const signature = await pkpWallet.signMessage(message);
      console.log("The signature is :",signature)
      console.log("address :",pkpWallet.address)
      pkpWallet.setChainId(80001);
      /**Testing smart account signer */
      //const smartAccountSigner: SmartAccountSigner = pkpWallet; // Assuming PKPEthersWallet is compatible with SmartAccountSigner
      //const signer: SmartAccountSigner = pkpWallet;

      
      
      // const createLitSignerWithAuthMethod = async () => {
      // return new LitSigner<LitAuthMethod>({
      //   pkpPublicKey: currentAccount.publicKey,
      //   rpcUrl: url,
      //   network:'cayenne'
      // });
      // };

      // const litSigner = await createLitSignerWithAuthMethod();

      // console.log(litSigner)

      // const authContext = {
      //   , // Include details from the authenticated authMethod
      //   sessionSigs, // Include the session signatures
      //   // Add any other necessary details for the authentication context
      // };
      
      // await litSigner.authenticate()
//       await litSigner.authenticate({        
//         controllerSessionSigs: sessionSigs,
//         pkpPubKey: currentAccount.publicKey,
//       })
//       console.log("The lit signer object : ",litSigner)
//       const address = await litSigner.getAddress();
//       console.log(address)

      //   const smartAccountClient = await createModularAccountAlchemyClient({
      //   apiKey: `iZDtkSlQWHXN8af_yP2u2RuhBDrKzoDH`,
      //   chain,
      //   signer: smartAccountSigner,
      //   gasManagerConfig: {
      //     policyId: "710569c2-8372-449d-83c2-f501257ce597",
      //   },      
      // });
       
      // console.log("Smart Contract Account : ",smartAccountClient)
      // console.log("Smart Contract Account address : ",smartAccountClient.getAddress())

      

 // const signature = await signEIP712(domain, types, jobInfo);

    const uoCallData = encodeFunctionData({
      abi: transferABI,
      functionName: "transfer",
      args: ["0x725b35D35eDE4157ebE5a57613609d40C4DB6aB7",'50000000'],
    });
    if (!uoCallData.startsWith('0x')) {
      throw new Error('Invalid call data format');
    }

    const transaction = {
      to: '0x9999f7Fea5938fD3b1E26A12c3f2fb024e194f97',
      data: uoCallData,
      // Optional: Specify gasPrice and gasLimit if desired
    };

      
  //   let uo:any;
  //   try{
  //   uo = await smartAccountClient.sendUserOperation({
  //     uo: {
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
        const data = createAuthPayload(pkpWallet.address,"localhost:3000",1)
      /**call the backend auth*/

      try{
        // const response = await axios.post('http://localhost:8000/auth/payload', data);
        // console.log('Payload Response from Server :', response.data);
        // /**if the payload is successful sign the response and send it back to backend for login*/
        // const payload = response.data;
        // console.log("The returned payload : ",payload, payload.domain)
        // const signObject = createLoginMessage(response.data)
        // console.log("message : ",signObject)
        // const payloadSign = await pkpWallet.signMessage(signObject)
        // console.log("signed payload message :",payloadSign);
        // const data_final = {
        //   payload:response.data.payload,
        //   signature: payloadSign
        // }

       // console.log("sending payload object : ",data_final)
        /**send the msg to server for login */
        const loginPayloadData = {
          type: "Ethereum",
          domain: "example.com",
          address: "0x1234567890abcdef1234567890abcdef12345678",
          statement: "Sign in to Example.com",
          version: "1",
          chain_id: "1",
          nonce: "unique_nonce",
          issued_at: new Date().toISOString(),
          expiration_time: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          resources: ["https://example.com/profile"],
        };
        
        const loginMessage = createLoginMessage(loginPayloadData);
        
        try{
          const login_response = await axios.post('http://localhost:8000/auth/login',loginMessage);
          console.log('login Response from Server :', login_response.data);
        }catch(err){console.log(err)}

      }catch(err){console.log(err)}

      setSignature(signature);

      // Get the address associated with the signature created by signing the message
      const recoveredAddr = ethers.utils.verifyMessage(message, signature);
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

  async function handleLogout() {
    try {
      await disconnectAsync();
    } catch (err) {}
    localStorage.removeItem('lit-wallet-sig');
    router.reload();
  }

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
