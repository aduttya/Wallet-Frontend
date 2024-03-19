// // components/SmartAccountCreator.tsx
// import React, { useState } from 'react';
// import { createSmartAccountClient, SmartAccountSigner } from '@alchemy/aa-core';
// import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

// interface SmartAccountCreatorProps {
//   sessionSigs: SessionSigs;
//   currentAccount: IRelayPKP;
// }

// const SmartAccountCreator: React.FC<SmartAccountCreatorProps> = ({
//   sessionSigs,
//   currentAccount,
// }) => {
//   const [smartAccountAddress, setSmartAccountAddress] = useState<string>();

//   const createSmartAccount = async () => {
//     try {
//       const pkpWallet = new PKPEthersWallet({
//         controllerSessionSigs: sessionSigs,
//         pkpPubKey: currentAccount.publicKey,
//       });
//       await pkpWallet.init();

//       const smartAccountSigner: SmartAccountSigner = pkpWallet; // Assuming PKPEthersWallet is compatible with SmartAccountSigner

//       const smartAccountClient = await createSmartAccountClient({
//         signer: smartAccountSigner,
//         // Other necessary options for smart account creation
//       });

//       // Assuming createSmartAccountClient returns the address of the created smart account
//       setSmartAccountAddress(smartAccountClient.getAddress());
//     } catch (error) {
//       console.error('Error creating smart account:', error);
//     }
//   };

//   return (
//     <div>
//       <button onClick={createSmartAccount}>Create Smart Account</button>
//       {smartAccountAddress && <p>Smart Account Address: {smartAccountAddress}</p>}
//     </div>
//   );
// };

// export default SmartAccountCreator;

/*
export type ThirdwebAuthOptions = {
  clientId?: string;
  secretKey?: string;
};

export type VerifyLoginPayloadParams = {
  payload: LoginPayload;
  options: VerifyOptions;
  clientOptions: ThirdwebAuthOptions;
};


export const VerifyOptionsSchema = z.object({
  domain: z.string(),
  statement: z.string().optional(),
  uri: z.string().optional(),
  version: z.string().optional(),
  chainId: z.string().optional(),
  validateNonce: z.function().args(z.string()).optional(),
  resources: z.array(z.string()).optional(),
});

export type VerifyOptions = z.input<typeof VerifyOptionsSchema>;

export const LoginPayloadDataSchema = z.object({
  type: AccountTypeSchema,
  domain: z.string(),
  address: z.string(),
  statement: z
    .string()
    .default(
      "Please ensure that the domain above matches the URL of the current website.",
    ),
  uri: z.string().optional(),
  version: z.string().default("1"),
  chain_id: z.string().optional(),
  nonce: z.string().default(() => uuidv4()),
  issued_at: z
    .date()
    .default(new Date())
    .transform((d) => d.toISOString()),
  expiration_time: z.date().transform((d) => d.toISOString()),
  invalid_before: z
    .date()
    .default(new Date())
    .transform((d) => d.toISOString()),
  resources: z.array(z.string()).optional(),
});

export const LoginPayloadSchema = z.object({
  payload: LoginPayloadDataSchema,
  signature: z.string(),
});

export type LoginPayload = z.output<typeof LoginPayloadSchema>;

*/