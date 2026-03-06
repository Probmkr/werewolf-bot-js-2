import { Client, Events, GatewayIntentBits } from "discord.js";

import { env } from "./env.js";
import { commandMap } from "./commands/index.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commandMap.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: "Unknown command.", ephemeral: true });
    return;
  }

  try {
    const result = await command.execute(interaction);
    await interaction.reply({ content: result.content });
  } catch (err) {
    console.error(err);
    const content = "An error occurred while executing this command.";
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content, ephemeral: true });
    } else {
      await interaction.reply({ content, ephemeral: true });
    }
  }
});

await client.login(env.DISCORD_TOKEN);

