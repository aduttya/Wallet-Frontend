import { useThirdwebAuthContext } from "../context/thirdweb-auth";
//import { cacheKeys } from "../../utils/cache-keys";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { signLoginPayload, type LoginPayloadData } from "@thirdweb-dev/auth";
import invariant from "tiny-invariant";
import { AUTH_TOKEN_STORAGE_KEY } from "../constats/auth";
import { QueryClient, QueryKey } from "@tanstack/react-query";



const TW_CACHE_KEY_PREFIX = "tw-cache";

function enforceCachePrefix(input: QueryKey): QueryKey {
  return [
    TW_CACHE_KEY_PREFIX,
    ...input.filter((i) => typeof i !== "string" || i !== TW_CACHE_KEY_PREFIX),
  ];
}

const cacheKeys = {
  auth: {
    user: () => enforceCachePrefix(["user"]),
  },
  // You can add other cache keys here if needed
};

export default cacheKeys;

  
export function useLogin() {
  const queryClient = useQueryClient();
  const authConfig = useThirdwebAuthContext();
  const wallet = useWallet();

  const login = useMutation({
    mutationFn: async () => {
      invariant(
        authConfig,
        "Please specify an authConfig in the ThirdwebProvider",
      );
      invariant(wallet, "You need a connected wallet to login.");
      invariant(
        authConfig.authUrl,
        "Please specify an authUrl in the authConfig.",
      );

      const address = await wallet.getAddress();
      const chainId = await wallet.getChainId();
      let res = await fetch(`${authConfig.authUrl}/payload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ address, chainId: chainId.toString() }),
      });

      if (!res.ok) {
        throw new Error(`Failed to get payload with status code ${res.status}`);
      }

      let payloadData: LoginPayloadData;
      try {
        ({ payload: payloadData } = await res.json());
      } catch {
        throw new Error(`Failed to get payload`);
      }

      const payload = await signLoginPayload({ wallet, payload: payloadData });

      res = await fetch(`${authConfig.authUrl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ payload }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.error) {
          throw new Error(data.error);
        }

        throw new Error(`Login request failed with status code ${res.status}`);
      }

      const { token } = await res.json();
      await authConfig.secureStorage?.setItem(AUTH_TOKEN_STORAGE_KEY, token);

      queryClient.invalidateQueries(cacheKeys.auth.user());

      return token;
    },
  });

  return {
    login: () => login.mutateAsync(),
    isLoading: login.isLoading,
  };
}



/**
 * The Login Implementation Flow
 * Sign In with Google
 * Use a state variable authMethod, take it from useAuthenticate
 * when user sign in with google trigger the useAuthenticate [authMethod]
 * Once authMethod object is defined use it fetchAccount [currentAccount]
 *     If there are account -> good to go
 *     If there aren't any account -> call the createAccount  
 * Initiate the session with authMethod and currentAccount [sessionSigs]
 * Auth with thirdweb with currentAccount and sessionSigs [IsLogin]
 */