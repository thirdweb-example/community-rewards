# Community Rewards

## Introduction

This example utilizes [signature-based minting](https://portal.thirdweb.com/advanced-features/on-demand-minting) of NFTs as a mechanism to reward users of a specific community. We connect user's with their Discord account, and generate signatures for an NFT if the user is a **member** of the Discord server.

## Using This Template

Create a project using this example:

```bash
npx thirdweb create --template
community-rewards
```

- Create an [NFT Collection](https://thirdweb.com/thirdweb.eth/TokenERC721) contract using the dashboard.
- Update the contract address and discord server id in the [consts](./consts.ts) file.

### Setting up Discord OAuth

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

You need to have an environment variable called `NEXTAUTH_SECRET` for the Discord Oauth to work.

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

### Other Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file:

WALLET_PRIVATE_KEY=
NEXT_PUBLIC_TEMPLATE_CLIENT_ID=
TW_SECRET_KEY=

- Generate your `TW_SECRET_KEY` and `NEXT_PUBLIC_TEMPLATE_CLIENT_ID` via thirdweb's dashboard.
- For `WALLET_PRIVATE_KEY` export your wallet private key from your wallet.

## Run Locally

Install dependencies

```bash
  # npm
  npm install

  # yarn
  yarn install
```

Start the server

```bash
  # npm
  npm run start

  # yarn
  yarn start
```

## Additional Resources

- [Documentation](https://portal.thirdweb.com)
- [Templates](https://thirdweb.com/templates)
- [Video Tutorials](https://youtube.com/thirdweb_)
- [Blog](https://blog.thirdweb.com)

## Contributing

Contributions and [feedback](https://feedback.thirdweb.com) are always welcome! Please check our [open source page](https://thirdweb.com/open-source) for more information.

## Need help?

For help, join the [discord](https://discord.gg/thirdweb) or visit our [support page](https://support.thirdweb.com).
