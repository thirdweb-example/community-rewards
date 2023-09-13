import { getServerSession } from "next-auth/next";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";
import { authOptions } from "./auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { CONTRACT_ADDRESS, DISCORD_SERVER_ID } from "../../consts";

export default async function generateNftSignature(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the Next Auth session so we can use the accessToken as part of the discord API request
  const session = await getServerSession(req, res, authOptions);

  // Grab the claimer address (currently connected address) out of the request body
  const { claimerAddress } = JSON.parse(req.body);

  // Read the access token from the session so we can use it in the below API request
  const accessToken = session?.accessToken;

  // Make a request to the Discord API to get the servers this user is a part of
  const response = await fetch(`https://discordapp.com/api/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // Parse the response as JSON
  const data = await response.json();

  // Filter all the servers to find the one we want
  // Returns undefined if the user is not a member of the server
  // Returns the server object if the user is a member
  const discordMembership = data?.find(
    (server: { id: string }) => server.id === DISCORD_SERVER_ID
  );

  // Return an error response if the user is not a member of the server
  // This prevents the signature from being generated if they are not a member
  if (!discordMembership) {
    return res.status(403).send("User is not a member of the discord server.");
  }

  // Checking to make sure the WALLET_PRIVATE_KEY is set in the .env.local file
  if (!process.env.WALLET_PRIVATE_KEY) {
    throw new Error(
      "You're missing WALLET_PRIVATE_KEY in your .env.local file."
    );
  }

  // Initialize the Thirdweb SDK on the server side using the private key on the mumbai network
  const sdk = ThirdwebSDK.fromPrivateKey(
    process.env.WALLET_PRIVATE_KEY,
    "mumbai",
    {
      secretKey: process.env.TW_SECRET_KEY,
    }
  );

  // Load the NFT Collection via it's contract address using the SDK
  const nftCollection = await sdk.getContract(
    CONTRACT_ADDRESS,
    "nft-collection"
  );

  // Generate the signature for the NFT mint transaction
  const signedPayload = await nftCollection.erc721.signature.generate({
    to: claimerAddress,
    metadata: {
      name: `thirdweb Discord Member NFT`,
      image: `${session.user.image}`,
      description: `An NFT rewarded for being a part of the thirdweb community!`,
    },
  });

  // Return back the signedPayload (mint signature) to the client.
  return res.status(200).json({
    signedPayload: JSON.parse(JSON.stringify(signedPayload)),
  });
}
