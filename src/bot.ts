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

const messageQueue: { chatId: number; message: string }[] = [];

// ... (commands and setup code)

// Function to process the next message in the queue
async function processNextMessage() {
  if (messageQueue.length > 0) {
    const { chatId, message } = messageQueue.shift()!;

    try {
      // Wait for the AI response before sending the reply
      const aiResponse = await AI(message);

      // Send the AI response back to the user
      await bot.api.sendMessage(chatId, aiResponse);
    } catch (error) {
      console.error("Error processing AI response:", error);
      // Optionally, handle errors and inform the user
      await bot.api.sendMessage(chatId, "Sorry, there was an error processing your request.");
    }

    // Process the next message in the queue
    processNextMessage();
  }
}

// Modified to queue incoming messages
bot.on("message", (ctx) => {
  const messageText = ctx.message?.text;
  const chatId = ctx.chat?.id;

  if (messageText && chatId) {
    // Queue the incoming message
    messageQueue.push({ chatId, message: messageText });

    // If the queue was empty, start processing messages
    if (messageQueue.length === 1) {
      processNextMessage();
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
