import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { NextApiRequest, NextApiResponse } from "next";
import { DISCORD_SERVER_ID } from "../../consts";

export default async function checkIsInServer(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Get the Next Auth session so we can use the accessToken as part of the discord API request
  const session = await getServerSession(req, res, authOptions);

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

  // Filter all the servers to find the one we want
  // Returns undefined if the user is not a member of the server
  // Returns the server object if the user is a member
  const thirdwebDiscordMembership = data?.find(
    (server: { id: string }) => server.id === DISCORD_SERVER_ID
  );

  // Return undefined or the server object to the client.
  return res
    .status(200)
    .json({ thirdwebMembership: thirdwebDiscordMembership ?? undefined });
}
