import { getSession } from "next-auth/react";

export default async function checkIsInServer(req, res) {
  // Get the Next Auth session so we can use the accessToken as part of the discord API request
  const session = await getSession({ req });

  console.log("Session:", session);

  // Put Your Discord Server ID here
  const discordServerId = "834227967404146718";

  // Read the access token from the session
  const accessToken = session?.accessToken;

  // Make a request to the Discord API to get the servers this user is a part of
  const response = await fetch(`https://discordapp.com/api/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 200) {
    // Parse the response as JSON
    const data = await response.json();

    // Filter all the servers to find the one we want
    // Returns undefined if the user is not a member of the server
    // Returns the server object if the user is a member
    const thirdwebDiscordMembership = data?.find(
      (server) => server.id === discordServerId
    );

    // Return undefined or the server object to the client.
    res
      .status(200)
      .json({ thirdwebMembership: thirdwebDiscordMembership ?? undefined });
  } else {
    // You may get rate limited here and receive an error.
    console.log("Error:", response.statusText);
    return;
  }
}
