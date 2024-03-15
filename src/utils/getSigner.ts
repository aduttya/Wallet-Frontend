// lib/getWallet.ts
import { checkAndSignAuthMessage, LitNodeClient } from '@lit-protocol/lit-node-client';
import { litNodeClient,litAuthClient } from '../utils/lit';

export async function getWallet(chain: string): Promise<any> {
  await litNodeClient.connect();

  const nonce = await litNodeClient.getLatestBlockhash();
  const authSig = await checkAndSignAuthMessage({
    chain,
    nonce,
  });

  console.log("The signature is : ",authSig)
  return authSig;
}
