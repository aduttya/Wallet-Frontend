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
import { http } from "viem";
import axios from 'axios';
import { LitSigner, LitAuthMethod } from "@alchemy/aa-signers/lit-protocol";

interface DashboardProps {
  currentAccount: IRelayPKP;
  sessionSigs: SessionSigs;
}

export const chain = polygonMumbai;
const rpcTransport = http("https://polygon-mumbai.g.alchemy.com/v2/demo");
const signer: SmartAccountSigner = LitAuthClient

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

      const signature = await pkpWallet.signMessage(message);
      console.log("The signature is :",signature)
      console.log("address :",pkpWallet.address)
      /**Testing smart account signer */
      // const smartAccountClient = await createModularAccountAlchemyClient({
      //   apiKey: `${process.env.ALCHEMY}`,
      //   chain,
      //   signer: signer
      // });
      // console.log("The Smart Account Address : ",smartAccountClient)
     // console.log("The Smart Account Address : ",(await smartAccountClient).getBalance)

     const createLitSignerWithAuthMethod = async () => {
      return new LitSigner<LitAuthMethod>({
        pkpPublicKey: currentAccount.publicKey,
        rpcUrl: rpcTransport,
      });
      };

      const litSigner = await createLitSignerWithAuthMethod();

      const authDetails = await litSigner.authenticate({
        context: LitAuthMethod,
      });
      console.log(authDetails)
      const address = await litSigner.getAddress();
      console.log(address)
      
      /**generate the payload */
     // const data = createAuthPayload(pkpWallet.address,"localhost:3000",1)
      /**call the backend auth*/

      // try{
      //   const response = await axios.post('http://localhost:8000/auth/payload', data);
      //   console.log('Payload Response from Server :', response.data);
      //   /**if the payload is successful sign the response and send it back to backend for login*/
      //   const signObject = JSON.stringify(response.data)
      //   const payloadSign = await pkpWallet.signMessage(signObject)
      //   console.log("signed payload message :",payloadSign);
      //   const data_final = {
      //     payload:response.data.payload,
      //     signature: payloadSign
      //   }

      //   console.log("sending payload object : ",data_final)
      //   /**send the msg to server for login */
      //   try{
      //     const login_response = await axios.post('http://localhost:8000/auth/login',data_final);
      //     console.log('login Response from Server :', login_response.data);
      //   }catch(err){console.log(err)}

      // }catch(err){console.log(err)}

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
