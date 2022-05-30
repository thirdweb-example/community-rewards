import { ChainId, ThirdwebProvider } from "@thirdweb-dev/react";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import "../styles/globals.css";

// This is the chainId your dApp will work on.
const activeChainId = ChainId.Mumbai;

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider desiredChainId={activeChainId}>
      {/* Next Auth Session Provider */}
      <SessionProvider session={pageProps.session}>
        <Head>
          <title>thirdweb Community Rewards Example</title>
        </Head>
        <Component {...pageProps} />
      </SessionProvider>
    </ThirdwebProvider>
  );
}

export default MyApp;
