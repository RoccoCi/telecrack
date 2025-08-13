const {NpsAppEnums} = require('../../enums/index');
const {NpsAppConfig} = require('../../configs/index');
const bot = require('../bot-api');

const logger = require('../logger');

const NpsTelegramEvent = require('./event');
const NpsTelegramCallback = require('./callback');
const NpsTelegramUser = require('./user');
const NpsTelegramChat = require('./chat');
const NpsTelegramInlineKeyboard = require('./inline');
const NpsTelegramKeyboard = require('./keyboard');
const NpsTelegramInput = require('./input');

const HashString = require('../hash');

require('dotenv').config();

let NpsBotInstance

class NpsTelegramBot {
    constructor() {
        if (NpsBotInstance) return NpsBotInstance
        try {
            this.bot = bot
        } catch (e) {
            throw new Error(e)
        }

        this.patterns = {}
        this.awaitingUsersInputs = {}
        this.awaitingChatsInputs = {}

        this.LoadErrorsHandlers();
        this.LoadEventsHandlers();

        NpsBotInstance = this
    }

    CreateInteraction = (textPattern, cb, commandDesc) => {
        if (this.patterns[textPattern]) {
            logger.error(`Pattern ${textPattern} already exists`);
            return
        }

        logger.info(`Registering pattern ${textPattern}`)
        this.patterns[textPattern] = {textPattern, cb, commandDesc}
        this.LoadInteractionsCommands();
    }

    LoadInteractionsCommands = async () => {
        const commands = []
        Object.values(this.patterns).forEach((patternData) => {
            if (patternData?.commandDesc && typeof(patternData.commandDesc)==="string") {
                commands.push({command: patternData.textPattern, description: patternData?.commandDesc});
            }
        });
        await this.bot.setMyCommands(commands);
    }

    CreateMessageCallback = () => {}

    GetUser = async (telegramUserId) => {
        if (!telegramUserId) {
            logger.warn("GetUser → telegramUserId not defined")
            return
        }
        const chatMemberData = await this.bot.getChatMember(telegramUserId)
        return new NpsTelegramUser(chatMemberData);
    }

    GetChat = async (chatId) => {
        if (!chatId) {
            logger.warn("GetChat → chatId not defined")
            return
        }
        const chatData = await this.bot.getChat(chatId)
        return new NpsTelegramChat(chatData);
    }

    AwaitUserInput = async (telegramUserId, inputInstructions) => {
        const User = new NpsTelegramUser(telegramUserId);
        // this.awaitingUsersInputs[User.GetId()] = 
        await User.AskInput(inputInstructions);
    }

    SendUserMessage = async (telegramUserId, content) => {
        const User = new NpsTelegramUser(telegramUserId);
        await User.SendMessage(content)
    }

    SendChatMessage = async (chatId, content) => {
        const chatData = await this.bot.getChat(chatId);
        const Chat = new NpsTelegramChat(chatData);
        
        await Chat.SendMessage(content)
    }

    SendChatVideoMessage = async (chatId, videoFile, caption, keyboard) => {
        const chatData = await this.bot.getChat(chatId);
        const Chat = new NpsTelegramChat(chatData);

        await Chat.SendVideoMessage(videoFile, caption, keyboard);
    }

    #GetPatternData = (pattern) => {
        const patternData = this.patterns[pattern];
        return patternData
    }

    // Middleware of any message event
    #ProcessMessageEvent = async (eventData) => {
        const Event = new NpsTelegramEvent(eventData);
        const messagePattern = eventData?.text

        if (!messagePattern) {
            logger.warn(`Ignoring incoming message, it doesn't contain any text`)
            return
        }
        
        if (Event.user?.askInput) {
            Event.user.askInputResolve(messagePattern)
            return
        }

        if (Event.chat.askInput) {
            Event.chat.askInputResolve(messagePattern)
            return
        }

        const keyboardButtonCallback = NpsTelegramKeyboard.GetHashedTextCallbackFn(HashString(messagePattern));

        if (typeof(keyboardButtonCallback)==="function") {
            await keyboardButtonCallback(Event);
            return
        } else {
            logger.debug(`Pattern ${messagePattern} isn't from a telegram keyboard`)
        }

        logger.debug(`Trying pattern ${messagePattern}`);

        const messagePatternData = this.#GetPatternData(messagePattern);

        if (!messagePatternData) {
            logger.warn(`No data found for pattern ${messagePattern}`)
            // METTRE UN MESSAGE A L'UTILISATEUR SI C EN PRIVE ?
            return
        }

        try {
            const messagePatternCb = messagePatternData.cb;
            if (!messagePatternCb) {
                logger.debug(`Pattern ${messagePattern} doesn't have callback`);
                return
            }

            try {
                await messagePatternCb(Event);
            } catch (e) {
                logger.warn(`Cb execution for pattern ${messagePattern} has not finished due to error\n${e}`)
            }
            
        } catch(e) {
            logger.error(`Failed to get pattern ${messagePattern}'s data`);
        }
    }

    // Middleware of any callback_query event
    #ProcessCallbackQuery = async (callbackQuery) => {
        const chatData = callbackQuery.message?.chat
        const chatId = chatData.id
        let userData = callbackQuery.message?.from

        if (userData.is_bot && chatData.type === 'private') {
            const updatedUser = await this.bot.getChatMember(chatId, chatId)
            userData = updatedUser
        }
        // https://t.me/sark0777
        console.table(userData)
        // 

        callbackQuery.message.from = userData
        console.table(callbackQuery.message.from)
        console.table(callbackQuery.message)

        const Callback = new NpsTelegramCallback(callbackQuery)
        const callbackQueryInlineKeyboard = new NpsTelegramInlineKeyboard(Callback.GetLinkedInlineKeyboardId());

        if (callbackQueryInlineKeyboard.IsDisabled(Callback.GetUniqueId())) {
            this.SendChatMessage(chatId, "Cette action est desactivée")
            return
        }

        callbackQueryInlineKeyboard.ExecuteCallback(Callback.GetUniqueId(), Callback.Event, ...Callback.GetParams())

        this.bot.answerCallbackQuery(Callback.GetId());

        if (callbackQueryInlineKeyboard.linked_message_id && !callbackQueryInlineKeyboard.multiple_choices) {
            await this.bot.editMessageReplyMarkup({}, {
                chat_id: callbackQueryInlineKeyboard.linked_chat_id,
                message_id: callbackQueryInlineKeyboard.linked_message_id,
                message_thread_id: callbackQueryInlineKeyboard.linked_message_thread_id
            });
        }
    }

    LoadEventsHandlers = () => {
        this.bot.on('message', this.#ProcessMessageEvent);
        NpsTelegramInput.GetHandlersTypes().forEach(handlerType => {
            logger.info(`Loading handler '${handlerType}': ⌛`);
            this.bot.on(handlerType, (eventData) => {
                const Event = new NpsTelegramEvent(eventData);
                if (!Event[handlerType]) {
                    logger.warn("Invalid input type")
                    return
                }
                logger.debug(handlerType)
                NpsTelegramInput.HandleInputs(Event)
            });
        });

        setTimeout(() => {
            this.bot.on('callback_query', this.#ProcessCallbackQuery);
        }, 1500)

        logger.info("Bot Handlers: ✅");
    }

    LoadErrorsHandlers = () => {
        this.bot.on('polling_error', (err) => {
            logger.error(err)
        });
        this.bot.on('error', (err) => {
            logger.error(err)
        });
    }
}

module.exports = new NpsTelegramBot(process.env.TELEGRAM_BOT_TOKEN);