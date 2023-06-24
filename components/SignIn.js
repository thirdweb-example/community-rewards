import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
import { signIn, signOut, useSession } from "next-auth/react";
import React from "react";
import styles from "../styles/Theme.module.css";

export default function SignIn() {
  const address = useAddress();
  const { data: session } = useSession();

  if (session && address) {
    return (
      <div className={styles.bigSpacerTop}>
        <a onClick={() => signOut()} className={styles.secondaryButton}>
          Sign out of Discord
        </a>
        |
        <ConnectWallet theme="dark" />
      </div>
    );
  }

  // 1. Connect with MetaMask
  if (!address) {
    return (
      <div className={styles.main}>
        <h2 className={styles.noGapBottom}>Connect Your Wallet</h2>
        <p>Connect your wallet to check eligibility.</p>
        <ConnectWallet theme="dark" />
      </div>
    );
  }

  // 2. Connect with Discord (OAuth)
  if (!session) {
    return (
      <div className={`${styles.main}`}>
        <h2 className={styles.noGapBottom}>Sign In with Discord</h2>
        <p>
          👋{" "}
          <i>
            Hey,{" "}
            {
              // truncate address
              address.slice(0, 6) + "..." + address.slice(-4)
            }
          </i>
        </p>

        <p>Sign In with Discord to check your eligibility for the NFT!</p>

        <p>
          <i>
            (we check to see if you are a member of the thirdweb discord when
            you try to mint).
          </i>
        </p>

        <button
          className={`${styles.mainButton} ${styles.spacerTop}`}
          onClick={signIn}
        >
          Connect Discord
        </button>
      </div>
    );
  }
}
