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
const introductionMessage = `Hello! I'm a LimitLess FX bot.
I'm powered by Artificial Intelligence to provide you with friendly assistant about "LimitLess FX", what we do and how we do it.

Get ready to be blown away!

<b>Commands</b>
/yo - Be greeted by me
/help `;

const aboutUrlKeyboard = new InlineKeyboard().url(
  "Host your own bot for free.",
  "https://cyclic.sh/"
);

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY || "",
});

const replyWithIntro = (ctx: any) =>
  ctx.reply(introductionMessage);

// Store promises and chat IDs to handle responses sequentially
const chatPromises = new Map<number, Promise<string>>();

// ... (commands and setup code)

// Modified to wait for the AI response before replying
bot.on("message", async (ctx) => {
  const messageText = ctx.message?.text;
  const chatId = ctx.chat?.id;

  if (messageText && chatId) {
    try {
      // Create a new promise for the AI response
      const aiResponsePromise = AI(messageText);

      // Store the promise with the chat ID
      chatPromises.set(chatId, aiResponsePromise);

      // Wait for the AI response before sending the reply
      const aiResponse = await aiResponsePromise;

      // Send the AI response back to the user
      ctx.reply(aiResponse);
    } catch (error) {
      console.error("Error processing AI response:", error);
      // Optionally, handle errors and inform the user
      ctx.reply("Sorry, there was an error processing your request.");
    } finally {
      // Clear the promise for the current chat ID
      chatPromises.delete(chatId);
    }
  }
});

// ... (rest of the code)

async function AI(message: string): Promise<string> {
  try {
    const generate = await cohere.generate({
      prompt: message,
    });
    console.log(generate.generations[0].text);

    return generate.generations[0].text;
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw error; // Propagate the error to the caller
  }
}
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
