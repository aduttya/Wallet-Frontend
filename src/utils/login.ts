// hooks/useThirdwebAuth.ts
import { useState,useCallback } from 'react';
import axios from 'axios';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';
import {IRelayPKP, SessionSigs } from '@lit-protocol/types';
import { useAuth } from '../context/AuthContext'; 


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

interface LoginProps {
    currentAccount: IRelayPKP;
    sessionSigs: SessionSigs;
}

export async function login({ currentAccount, sessionSigs }: LoginProps) {
  try {
    const pkpWallet = new PKPEthersWallet({
      controllerSessionSigs: sessionSigs,
      pkpPubKey: currentAccount.publicKey,
    });
    await pkpWallet.init();

    const data = createAuthPayload(pkpWallet.address, "localhost:3000", 1);
    const response = await axios.post('http://localhost:1337/api/auth/payload', data);
    const payload = response.data.payload;

    const payloadObject = createLoginMessage(payload);
    const signature = await pkpWallet.signMessage(payloadObject);
    console.log("The signature is : ",signature)
    const finalData = {
      payload: {
        payload,
        signature
      },
    };

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'http://localhost:1337/api/auth/login',
      headers: { 
        'Content-Type': 'application/json'
      },
      data: JSON.stringify(finalData),
    };

    const loginResponse = await axios.request(config);
    localStorage.setItem('jwtToken', loginResponse.data.token);
    console.log("login with thirdweb is successful")
    return loginResponse.data;
  } catch (error) {
    throw error;
  }
}
