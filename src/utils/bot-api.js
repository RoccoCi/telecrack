const logger = require('./logger');
const TelegramClient = require('node-telegram-bot-api');
// const { NpsTelegramBotConfig } = require('../configs/index');

let TelegramBotInstance

const GetTelegramBotInstance = (botToken) => {
    if (TelegramBotInstance) return TelegramBotInstance;
    TelegramBotInstance = new TelegramClient(botToken, {polling:true});
    logger.info("Bot service: ✅");
    return TelegramBotInstance
}

module.exports = GetTelegramBotInstance(process.env.TELEGRAM_BOT_TOKEN);