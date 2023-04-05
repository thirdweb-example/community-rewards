# Community Rewards Example

## Introduction

In this guide, we will utilize [signature-based minting](https://portal.thirdweb.com/advanced-features/on-demand-minting) of NFTs as a mechanism to reward users of a specific community. We connect user's with their Discord account, and generate signatures for an NFT if the user is a **member** of the Discord server.

**Check out the Demo here**: https://community-rewards.thirdweb-example.com

If you're interested in reading the basics of signature-based minting, we recommend starting with this example repository: https://github.com/thirdweb-example/signature-based-minting-next-ts

## Tools:

- [**React SDK**](https://docs.thirdweb.com/react): To connect to our NFT Collection Smart contract via React hooks such as [useNFTCollection](https://docs.thirdweb.com/react/react.usenftcollection), and allow users to sign in with [useMetamask](https://docs.thirdweb.com/react/react.usemetamask).

- [**NFT Collection**](https://portal.thirdweb.com/pre-built-contracts/nft-collection): This is the smart contract that our NFTs will be created into.

- [**TypeScript SDK**](https://docs.thirdweb.com/typescript): To mint new NFTs with [signature based minting](https://docs.thirdweb.com/typescript/sdk.nftcollection.signature)!

- [**Next JS API Routes**](https://nextjs.org/docs/api-routes/introduction): For us to securely generate signatures on the server-side, on behalf of our wallet, using our wallet's private key. As well as making server-side queries to the Discord APIs with the user's access token to view which servers they are part of.

- [**NextAuth**](https://next-auth.js.org/): To authenticate with Discord and access the user's Discord data such as their username, and which servers they are members of.

## Using This Repo

- Create an NFT Collection contract via the thirdweb dashboard on the Polygon Mumbai (MATIC) test network.

- Create a project using this example by running:

```bash
npx thirdweb create --template community-rewards
```

- Find and replace our demo NFT Collection address (`0xb5201E87b17527722A641Ac64097Ece34B21d10A`) in this repository with your NFT Collection contract address from the dashboard.

- We use the thirdweb discord server ID `834227967404146718`. Find and replace instances of this ID with your own Discord server ID. You can learn how to get your Discord server ID from [this guide](https://www.alphr.com/discord-find-server-id/).

```bash
npm install
# or
yarn install
```

- Run the development server:

```bash
npm run start
# or
yarn start
```

- Visit http://localhost:3000/ to view the demo.

# Guide

This project uses signature-based minting to grant mint signatures to wallets who meet a certain set of criteria.

You can see the basic flow of how signature based minting works in this application below:

![Signature Based Minting Diagram](https://camo.githubusercontent.com/bb1faa695e6c5968fb6f264ef49c3e3d3981e4a67654370b220b7bf491d69382/68747470733a2f2f63646e2e686173686e6f64652e636f6d2f7265732f686173686e6f64652f696d6167652f75706c6f61642f76313635303935383535393234392f53386d6c5a49515a6d2e706e67)

In this example, we use signature-based minting to exclusively grant signatures to users who are members of the Discord server with ID `834227967404146718`; the thirdweb discord server.

The general flow of the application is this:

1. User connects their wallet with MetaMask
2. User authenticates / signs in with Discord
3. User attempts **mint** function
4. Server checks if user is a member of the Discord server
5. If the user is a member, the server generates a signature for the user's wallet
6. The server sends the signature to the client
7. The client uses the signature to mint an NFT into their wallet

In the below sections, we'll outline how each of these steps work and explain the different parts of the application.

## Connecting With Metamask

We have a component that handles the sign in logic for both MetaMask and Discord in [/components/SignIn.js](/components/SignIn.js).

For the MetaMask connection, we are using the [useMetamask](https://docs.thirdweb.com/react/react.usemetamask) hook from the thirdweb React SDK.

```jsx
const connectWithMetamask = useMetamask();
```

This works because we have the `ThirdwebProvider` setup in our [\_app.js](/pages/_app.js) file, which allows us to use all of the thirdweb React SDK's helpful hooks.

```jsx
// This is the chain your dApp will work on.
const activeChain = "mumbai";

function MyApp({ Component, pageProps }) {
  return (
    <ThirdwebProvider activeChain={activeChain}>
      {/* Next Auth Session Provider */}
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
      </SessionProvider>
    </ThirdwebProvider>
  );
}
```

## Connect with Discord

We are using the Authentication library [NextAuth.js](https://next-auth.js.org/) to authenticate users with their Discord accounts.

`NextAuth` uses the [`pages/api/auth/[...nextauth].js`](./pages/api/auth/[...nextauth].js) file to handle the authentication logic such as redirects for us.

We setup the Discord Provider and pass in our Discord applications information that we got from the Discord Developer Portal (discussed below).

```jsx
  providers: [
    DiscordProvider({
      clientId: process.env.CLIENT_ID,
      clientSecret: process.env.CLIENT_SECRET,
      authorization: { params: { scope: "identify guilds" } },
    }),
  ],
```

As you can see, we are also requesting additional scope on the user's profile called `identify guilds`.

This is so that we can later make another API request an access which servers the user is a member of.

### Setting Up Your Discord Application

Head to the [Discord Developer portal](https://discord.com/developers/applications) and create a new application.

Under the `Oauth2` tab, copy your client ID and client secret. We need to store these as environment variables in our project so that we can use them on the API routes in our application.

Create a file at the root of your project called `.env.local` and add the following lines:

```bash
CLIENT_ID=<your-discord-client-id-here>
CLIENT_SECRET=<your-discord-client-secret-here>
```

Back in the Discord portal, under the `Redirects` section, you need to add the following value as a redirect URI:

```
http://localhost:3000/api/auth/callback/discord
```

When you deploy to production, you will need to do the same again; and replace the `http://localhost:3000/` with your domain.

In the `SignIn` component, we are importing functions from `next-auth/react` to sign in and out with Discord.

```jsx
import { useSession, signIn, signOut } from "next-auth/react";
```

We then user is signed in, we can access their session information using the `useSession` hook:

```jsx
const { data: session } = useSession();
```

One final detail on the Discord connection is that we have some custom logic to append the `accessToken` to the `session`, so that we can use this to make further API requests. i.e. we need the user's access token to provide to the `Authorization Bearer` when we make the API request to see which servers this user is a part of.

```jsx
// Inside [...nextauth.js]

// When the user signs in, get their token
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },

    // When we ask for session info, also get the accessToken.
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      session.accessToken = token.accessToken;
      return session;
    },
  },
```

Now when we call `useSession` or `getSession`, we have access to the `accessToken` of the user; which allows us to make further requests to the Discord API.

## Checking User's Discord Servers

Before the user see's the mint button, we make a check to see if the user is a member of the Discord server, using Next.js API Routes.

This logic is performed on the [pages/api/check-is-in-server.js](./pages/api/check-is-in-server.js) file.

First, we get the user's accessToken from the session.

We use this accessToken to request which servers the user is a member of.

```jsx
// Get the Next Auth session so we can use the accessToken as part of the discord API request
const session = await getSession({ req });
// Read the access token from the session
const accessToken = session?.accessToken;

// Make a request to the Discord API to get the servers this user is a part of
const response = await fetch(`https://discordapp.com/api/users/@me/guilds`, {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});

// Parse the response as JSON
const data = await response.json();
```

Now we have all the servers the user is a member of inside the `data` variable. We can filter the array of servers to find the one we are looking for:

```jsx
// Put Your Discord Server ID here
const discordServerId = "834227967404146718";

// Filter all the servers to find the one we want
// Returns undefined if the user is not a member of the server
// Returns the server object if the user is a member
const thirdwebDiscordMembership = data?.find(
  (server) => server.id === discordServerId
);

// Return undefined or the server object to the client.
res.status(200).json({ thirdwebMembership: thirdwebDiscordMembership });
```

We then make a `fetch` request on the client to this API route on the [index.js](./pages/index.js) file:

```jsx
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
        setData(d);
        setLoading(false);
      });
  }
}, [session]);
```

We use this information on the client to show either a **mint** button or a **Join Server** button to the user:

```jsx
data ? (
  <div>
    <h3>Hey {session?.user?.name} 👋</h3>
    <h4>Thanks for being a member of the Discord.</h4>
    <p>Here is a reward for you!</p>

    <button onClick={mintNft}>Claim NFT</button>
  </div>
) : (
  <div>
    <p>Looks like you are not a part of the Discord server.</p>
    <a href={`https://discord.com/invite/thirdweb`}>Join Server</a>
  </div>
);
```

Now the user can either make another request to mint the NFT, or join the Discord server.

## Signature Based Minting

On the client-side, when the user clicks the `Mint` button, we make a request to the [generate-signature](./pages/api/generate-signature.js) API route to ask the server to generate a signature for us to use to mint an NFT.

```jsx
// Make a request to the API route to generate a signature for us to mint the NFT with
const signature = await fetch(`/api/generate-signature`, {
  method: "POST",
  body: JSON.stringify({
    // Pass our wallet address (currently connected wallet) as the parameter
    claimerAddress: address,
  }),
});
```

The API runs the same check as described above, where we utilize the session's `accessToken` to ensure the user is a part of the Discord server before generating a signature.

```jsx
// ... Same Discord API Checks as above.

// Return an error response if the user is not a member of the server
// This prevents the signature from being generated if they are not a member
if (!discordMembership) {
  res.status(403).send("User is not a member of the discord server.");
  return;
}
```

If the user is a member of the server, we can start the process of generating the signature for the NFT.

Firstly, we initialize the thirdweb SDK using our private key.

```jsx
// Initialize the Thirdweb SDK on the serverside using the private key on the mumbai network
const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY, "mumbai");
```

You'll need another entry in your `.env.local` file, containing your private key for this to work.

**IMPORTANT:** Never use your private key value outside of a secured server-side environment.

```
PRIVATE_KEY=<your-private-key-here>
```

Next, we get our NFT collection contract:

```jsx
// Load the NFT Collection via it's contract address using the SDK
const nftCollection = sdk.getNFTCollection(
  "0xb5201E87b17527722A641Ac64097Ece34B21d10A"
);
```

And finally generate the signature for the NFT:

We use the information of the user's Discord profile for the metadata of the NFT! How cool is that?

```jsx
// Generate the signature for the NFT mint transaction
const signedPayload = await nftCollection.signature.generate({
  to: claimerAddress,
  metadata: {
    name: `${session.user.name}'s Thirdweb Discord Member NFT`,
    image: `${session.user.image}`,
    description: `An NFT rewarded to ${session.user.name} for being a part of the thirdweb community!`,
  },
});
```

And return this signature back to the client:

```jsx
// Return back the signedPayload (mint signature) to the client.
res.status(200).json({
  signedPayload: JSON.parse(JSON.stringify(signedPayload)),
});
```

The client uses this signature to `mint` the NFT that was generated on the server back on [index.js](./pages/index.js):

```jsx
// If the user meets the criteria to have a signature generated, we can use the signature
// on the client side to mint the NFT from this client's wallet
if (signature.status === 200) {
  const json = await signature.json();
  const signedPayload = json.signedPayload;

  // Use the signature to mint the NFT from this wallet
  const nft = await nftCollectionContract?.signature.mint(signedPayload);
}
```

Voilà! You have generated a signature for an NFT on the server-side, and used the signature to mint that NFT on the client side! Effectively, restricting access to an exclusive set of users to mint NFTs in your collection.

## Going to production

In a production environment, you need to have an environment variable called `NEXTAUTH_SECRET` for the Discord Oauth to work.

You can learn more about it here:
https://next-auth.js.org/configuration/options

You can quickly create a good value on the command line via this openssl command.

```bash
openssl rand -base64 32
```

And add it as an environment variable in your `.env.local` file:

```
NEXTAUTH_SECRET=<your-value-here>
```

## Join our Discord!

For any questions, suggestions, join our discord at [https://discord.gg/cd thirdweb](https://discord.gg/thirdweb).
