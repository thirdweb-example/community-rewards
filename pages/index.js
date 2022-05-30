import {
  useAddress,
  useNFTCollection,
  useNetwork,
  useNetworkMismatch,
} from "@thirdweb-dev/react";
import { ChainId } from "@thirdweb-dev/react";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import SignIn from "../components/SignIn";
import styles from "../styles/Theme.module.css";

export default function Home() {
  // Grab the currently connected wallet's address
  const address = useAddress();

  // Get the currently authenticated user's session (Next Auth + Discord)
  const { data: session } = useSession();

  // Hooks to enforce the user is on the correct network (Mumbai as declared in _app.js) before minting
  const isOnWrongNetwork = useNetworkMismatch();
  const [, switchNetwork] = useNetwork();

  // Get the NFT Collection we deployed using thirdweb+
  const nftCollectionContract = useNFTCollection(
    "0xb5201E87b17527722A641Ac64097Ece34B21d10A"
  );

  // This is simply a client-side check to see if the user is a member of the discord in /api/check-is-in-server
  // We ALSO check on the server-side before providing the signature to mint the NFT in /api/generate-signature
  // This check is to show the user that they are eligible to mint the NFT on the UI.
  const [data, setData] = useState(null);
  const [isLoading, setLoading] = useState(false);
  useEffect(() => {
    if (session) {
      setLoading(true);
      // Load the check to see if the user  and store it in state
      fetch("api/check-is-in-server")
        .then((res) => res.json())
        .then((d) => {
          setData(d || undefined);
          setLoading(false);
        });
    }
  }, [session]);

  // Function to create a signature on the server-side, and use the signature to mint the NFT
  async function mintNft() {
    // Ensure wallet connected
    if (!address) {
      alert("Please connect your wallet to continue.");
      return;
    }

    // Ensure correct network
    if (isOnWrongNetwork) {
      switchNetwork(ChainId.Mumbai);
      return;
    }

    // Make a request to the API route to generate a signature for us to mint the NFT with
    const signature = await fetch(`/api/generate-signature`, {
      method: "POST",
      body: JSON.stringify({
        // Pass our wallet address (currently connected wallet) as the parameter
        claimerAddress: address,
      }),
    });

    // If the user meets the criteria to have a signature generated, we can use the signature
    // on the client side to mint the NFT from this client's wallet
    if (signature.status === 200) {
      const json = await signature.json();
      const signedPayload = json.signedPayload;
      const nft = await nftCollectionContract?.signature.mint(signedPayload);

      // Show a link to view the NFT they minted
      alert(
        `Success 🔥 Check out your NFT here: https://testnets.opensea.io/assets/mumbai/0xb5201e87b17527722a641ac64097ece34b21d10a/${nft.id.toNumber()}`
      );
    }
    // If the user does not meet the criteria to have a signature generated, we can show them an error
    else {
      alert("Something went wrong. Are you a member of the discord?");
    }
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>thirdweb Community Rewards Example</h1>

      <p className={styles.explain}>
        An example project demonstrating how you can use{" "}
        <a
          href="https://thirdweb.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.purple}
        >
          thirdweb
        </a>
        &apos;s signature-based minting to reward your community.
      </p>

      <p className={styles.explain}>
        This demo checks if the user is a member of your Discord server, and
        allows them to mint an NFT if they are.
      </p>

      <hr className={styles.divider} />

      <SignIn />

      {address && session ? (
        isLoading ? (
          <p>Checking...</p>
        ) : data ? (
          <div className={`${styles.main} ${styles.spacerTop}`}>
            <h3>Hey {session?.user?.name} 👋</h3>
            <h4>Thanks for being a member of the Discord.</h4>
            <p>Here is a reward for you!</p>

            {/* NFT Preview */}
            <div className={styles.nftPreview}>
              <b>Your NFT:</b>
              <img src={session?.user.image} />
              <p>{session.user.name}&apos;s thirdweb Discord Member NFT</p>
            </div>

            <button
              className={`${styles.mainButton} ${styles.spacerTop}`}
              onClick={mintNft}
            >
              Claim NFT
            </button>
          </div>
        ) : (
          <div className={`${styles.main} ${styles.spacerTop}`}>
            <p>Looks like you are not a part of the Discord server.</p>
            <a
              className={styles.mainButton}
              href={`https://discord.com/invite/thirdweb`}
            >
              Join Server
            </a>
          </div>
        )
      ) : null}
    </div>
  );
}
