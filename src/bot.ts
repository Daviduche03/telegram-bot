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
  .text("Yes, they certainly are").row()
  .text("I'm not quite sure").row()
  .text("No. 😈")
  .resized();

bot.command("help", (ctx) => {
  await ctx.reply(text, {
    reply_markup: keyboard,
  });
})

// Handle the /effect command to apply text effects using an inline keyboard
// (Existing code for /effect command remains unchanged)

// Handle all other messages and the /start command
const introductionMessage = `Hello! I'm a Telegram bot.
I'm powered by Cyclic, the next-generation serverless computing platform.

<b>Commands</b>
/yo - Be greeted by me
/effect [text] - Show a keyboard to apply text effects to [text]`;

const aboutUrlKeyboard = new InlineKeyboard().url(
  "Host your own bot for free.",
  "https://cyclic.sh/"
);

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || "",
});

async function AI(message: string) {
  const generate = await cohere.generate({
    prompt: message,
  });
  console.log(generate.generations[0].text);

 return generate.generations[0].text
}

const replyWithIntro = (ctx: any) =>
  ctx.reply(introductionMessage, {
    reply_markup: aboutUrlKeyboard,
    parse_mode: "HTML",
  });

bot.command("start", replyWithIntro);

// Modified to echo back any received message
bot.on("message", async (ctx) => {
  const messageText = ctx.message?.text;

  const res = await AI(messageText || "hi");
  if (messageText) {
    ctx.reply(res);
  }
});

// Start the server exprss
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
