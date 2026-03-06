import { REST, Routes } from "discord.js";

import { env } from "./env.js";
import { commands } from "./commands/index.js";

const rest = new REST({ version: "10" }).setToken(env.DISCORD_TOKEN);
const body = commands.map((c) => c.data.toJSON());

const route = env.GUILD_ID
  ? Routes.applicationGuildCommands(env.CLIENT_ID, env.GUILD_ID)
  : Routes.applicationCommands(env.CLIENT_ID);

const scope = env.GUILD_ID ? `guild(${env.GUILD_ID})` : "global";

console.log(`Deploying ${body.length} command(s) to ${scope}...`);
await rest.put(route, { body });
console.log("Done.");

