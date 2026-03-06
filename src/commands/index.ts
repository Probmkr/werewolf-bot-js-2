import type { ChatInputCommandInteraction, RESTPostAPIChatInputApplicationCommandsJSONBody } from "discord.js";

import { pingCommand } from "./ping.js";

export type Command = {
  data: { toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute: (interaction: ChatInputCommandInteraction) => Promise<{ content: string }>;
};

export const commands: Command[] = [pingCommand];

export const commandMap = new Map(commands.map((c) => [c.data.toJSON().name, c]));

