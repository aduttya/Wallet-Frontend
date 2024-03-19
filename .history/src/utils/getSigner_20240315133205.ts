// lib/getWallet.ts
import { checkAndSignAuthMessage, LitNodeClient } from '@lit-protocol/lit-node-client';
import { litNodeClient,litAuthClient } from '../utils/lit';
import { createModularAccountAlchemyClient } from "@alchemy/aa-alchemy";
import { LocalAccountSigner, sepolia,createSmartAccountClient,SmartAccountSigner } from "@alchemy/aa-core";
import { createMultiOwnerModularAccount } from "@alchemy/aa-accounts";
import { http } from "viem";

export const chain = sepolia;
const rpcTransport = http("https://polygon-mumbai.g.alchemy.com/v2/demo");
const signer: SmartAccountSigner = LitAuthClient

export const smartAccountClient = createModularAccountAlchemyClient({
  apiKey: `${process.env.ALCHEMY}`,
  chain,
  // you can swap this out for any SmartAccountSigner
  signer: signer
});

console.log(smartAccountClient)
// export const smartAccountClient = createSmartAccountClient({
//   transport: rpcTransport,
//   chain,
//   account: await createMultiOwnerModularAccount({
//     transport: rpcTransport,
//     chain,
//     signer,
//   }),
// });

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

