// lib/getWallet.ts
import { checkAndSignAuthMessage, LitNodeClient } from '@lit-protocol/lit-node-client';
import { litNodeClient,litAuthClient } from '../utils/lit';


import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, sepolia } from "@alchemy/aa-core";

export const chain = sepolia;

export const smartAccountClient = createModularAccountAlchemyClient({
  apiKey: `${process.env.ALCHEMY}`,
  chain,
  // you can swap this out for any SmartAccountSigner
  signer: LocalAccountSigner.mnemonicToAccountSigner("OWNER_MNEMONIC"),
});


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

