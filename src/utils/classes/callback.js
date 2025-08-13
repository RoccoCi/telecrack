// const NpsTelegramUser = require('./user');
const logger = require('../logger');
const NpsTelegramEvent = require('./event');

class NpsTelegramCallback {
    constructor(callbackData) {
        this.callback_id = callbackData?.id
        // this.from = new NpsTelegramUser(callbackData?.message?.from);
        logger.info("Received callback")
        // logger.info("Callback Message: " + callbackData?.message || "Empty")
        logger.info(callbackData?.message?.from?.id)
        this.Event = new NpsTelegramEvent(callbackData?.message, true)
        this.inline_message_id = callbackData?.inline_message_id
        this.chat_instance = callbackData?.chat_instance
        this.data = callbackData?.data

        this.inlineKeyboardId = null
        this.callbackUid = null

        this.params = []

        this.#ProcessData();
    }

    GetLinkedInlineKeyboardId = () => {
        return this.inlineKeyboardId;
    }

    GetId = () => {
        return this.callback_id
    }

    GetUniqueId = () => {
        return this.callbackUid;
    }

    GetParams = () => {
        return this.params
    }

    #ProcessData = () => {
        const callbackDataArray = this.data?.split("_");
        this.inlineKeyboardId = callbackDataArray[0]
        this.callbackUid = callbackDataArray[1]

        callbackDataArray.splice(0,1);

        callbackDataArray.forEach((param) => {
            this.params.push(param)
        });
    }

    debug = () => {
        logger.debug(typeof(this.Event))
        logger.debug(`KboardID ${this.inlineKeyboardId} | CallbackUID: ${this.callbackUid}`)
        logger.debug('==== PARAMS ====')
        this.params.forEach(param => {
            logger.debug(param)
        })
        logger.debug("====PARAMS END ====")
    }
}

module.exports = NpsTelegramCallback;