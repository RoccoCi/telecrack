const NpsTelegramUser = require('./user');
const NpsTelegramChat = require('./chat');
const logger = require('../logger');

class NpsTelegramEvent {
    constructor(eventData, isCallback) {
        this.callback_id = eventData?.callback_id
        this.message_id = eventData.message_id
        this.message_thread_id = eventData.message_thread_id

        if (!eventData?.from) {
            logger.warn("NpsTelegramEvent: Receiving event with empty user")
        }

        if (!eventData?.chat) {
            logger.warn("NpsTelegramEvent: Receiving event with empty chat")
        }
        
        if (isCallback && eventData?.from?.is_bot) {
            this.user = new NpsTelegramUser(eventData?.chat);
        } else {
            this.user = new NpsTelegramUser(eventData?.from);
        }

        logger.debug(`NpsTelegramEvent: Telegram event user type: ${typeof(this.user)}`)

        this.chat = new NpsTelegramChat(eventData?.chat);

        if (this.callback_id && this.chat?.private) {
            logger.info("NpsTelegramEvent: Callback event detected");
        }

        this.text = eventData?.text
        this.video = eventData?.video
        this.photo = eventData?.photo

        this.date = new Date(eventData?.date);
    }

    debug = () => {
        logger.debug("==== EVENT DBG ====")
        logger.debug(`User: ${this.user.toString()}`);
        logger.debug(`Chat: ${this.chat.toString()}`);
        logger.debug(`Date: ${this.date.toString()}`);
        logger.debug("===================")
    }
}

module.exports = NpsTelegramEvent;