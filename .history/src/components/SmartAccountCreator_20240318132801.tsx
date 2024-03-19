// components/SmartAccountCreator.tsx
import React, { useState } from 'react';
import { createSmartAccountClient, SmartAccountSigner } from '@alchemy/aa-core';
import { PKPEthersWallet } from '@lit-protocol/pkp-ethers';

interface SmartAccountCreatorProps {
  sessionSigs: SessionSigs;
  currentAccount: IRelayPKP;
}

const SmartAccountCreator: React.FC<SmartAccountCreatorProps> = ({
  sessionSigs,
  currentAccount,
}) => {
  const [smartAccountAddress, setSmartAccountAddress] = useState<string>();

  const createSmartAccount = async () => {
    try {
      const pkpWallet = new PKPEthersWallet({
        controllerSessionSigs: sessionSigs,
        pkpPubKey: currentAccount.publicKey,
      });
      await pkpWallet.init();

      const smartAccountSigner: SmartAccountSigner = pkpWallet; // Assuming PKPEthersWallet is compatible with SmartAccountSigner

      const smartAccountClient = await createSmartAccountClient({
        signer: smartAccountSigner,
        // Other necessary options for smart account creation
      });

      // Assuming createSmartAccountClient returns the address of the created smart account
      setSmartAccountAddress(smartAccountClient.getAddress());
    } catch (error) {
      console.error('Error creating smart account:', error);
    }
  };

  return (
    <div>
      <button onClick={createSmartAccount}>Create Smart Account</button>
      {smartAccountAddress && <p>Smart Account Address: {smartAccountAddress}</p>}
    </div>
  );
};

export default SmartAccountCreator;
