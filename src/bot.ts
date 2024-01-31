import { Bot, InlineKeyboard, webhookCallback, Keyboard } from "grammy";
import { chunk } from "lodash";
import express from "express";
import { applyTextEffect, Variant } from "./textEffects";

import { CohereClient } from "cohere-ai";

import type { Variant as TextEffectVariant } from "./textEffects";

// Create a bot using the Telegram token
const bot = new Bot(process.env.TELEGRAM_TOKEN || "");

// Handle the /yo command to greet the user
bot.command("yo", (ctx) => ctx.reply(`Yo ${ctx.from?.username}`));

const keyboard = new Keyboard()
  .text("What do guys do?").row()
  .text("Our Mission?").row()
  .text("Book a call")
  .resized();

bot.command("help", async (ctx) => {
  await ctx.reply("Here's a list of commands:", {
    reply_markup: keyboard,
  });
})

// Handle the /effect command to apply text effects using an inline keyboard
// (Existing code for /effect command remains unchanged)

// Handle all other messages and the /start command
// Handle the /start command
bot.command("start", (ctx) => {
  ctx.reply("Hello! I'm your versatile bot. You can use me to broadcast messages, send direct messages, and answer questions!");
});

// Handle the /broadcast command to send a message to a channel or group
bot.command("broadcast", (ctx) => {
  // Replace CHANNEL_ID with the actual channel or group ID
  const channelID = "@YourChannelID";
  ctx.api.sendMessage(channelID, "This is a broadcast message!");
  ctx.reply("Broadcast sent!");
});

// Handle the /senddirect command to send a direct message to a user
bot.command("senddirect", (ctx) => {
  // Replace USER_ID with the actual user ID
  const userID = 2137148868;
  ctx.api.sendMessage(userID, "This is a direct message!");
  ctx.reply("Direct message sent!");
});

// Handle all other messages
bot.on("message", (ctx) => {
  const messageText = ctx.message?.text;

  if (messageText) {
    // Implement logic to analyze incoming messages and provide responses
    // For simplicity, let's echo the message for now
    ctx.reply(`You said: ${messageText}`);
  }
}); 
if (process.env.NODE_ENV === "production") {
  // Use Webhooks for the production server
  const app = express();
  app.use(express.json());
  app.use(webhookCallback(bot, "express"));

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Bot listening on port ${PORT}`);
  });
} else {
  // Use Long Polling for development
  bot.start();
}
