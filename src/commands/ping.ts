import { SlashCommandBuilder } from "discord.js";
import type { ChatInputCommandInteraction } from "discord.js";

export const werewolfCommand = {
  data: new SlashCommandBuilder()
    .setName("werewolf")
    .setDescription("Werewolf game commands")
    .addSubcommand((sub) =>
      sub.setName("ping").setDescription("Replies with Pong!"),
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    const subcommand = interaction.options.getSubcommand();

    switch (subcommand) {
      case "ping":
        return { content: "Pong!" };
      default:
        return { content: "Unknown subcommand." };
    }
  },
};

