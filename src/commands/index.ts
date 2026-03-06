import type {
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from "discord.js";

import * as werewolfCommand from "./werewolf.js";

export type Command = {
  data: { toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody };
  execute: (
    interaction: ChatInputCommandInteraction,
  ) => Promise<void | { content: string } | unknown>;
};

export const commands: Command[] = [werewolfCommand];

export const commandMap = new Map(
  commands.map((c) => [c.data.toJSON().name, c]),
);
