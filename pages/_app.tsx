import { ThirdwebProvider } from "@thirdweb-dev/react";
import { SessionProvider } from "next-auth/react";
import Head from "next/head";
import "../styles/globals.css";
import { AppProps } from "next/app";

// This is the chain your dApp will work on.
const activeChain = "mumbai";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThirdwebProvider
      activeChain={activeChain}
      clientId={process.env.NEXT_PUBLIC_TEMPLATE_CLIENT_ID}
    >
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
