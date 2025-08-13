const {NpsAppConfig} = require('../../configs/index');
const logger = require('../logger');
const bot = require('../bot-api');
const NpsTelegramKeyboard = require('./keyboard');
const NpsTelegramInlineKeyboard = require('./inline');

const chatsMemoization = {}

class NpsTelegramChat {
    constructor(chatData) {
        if (!chatData?.id) {
            logger.error(`Failed to get chat ${chatData?.id}`)
            return
        }
        
        if (chatsMemoization[chatData?.id]) return chatsMemoization[chatData?.id];

        this.id = chatData?.id
        this.type = chatData?.type
        this.extraData = chatData
        this.askInput = false

        chatsMemoization[this.id] = this
    }

    GetId = () => {
        return this.id
    }

    GetType = () => {
        return this.type
    }

    GetMessageOptions = (options, keyboard) => {
        let keyboardOptions = {}
        if (keyboard instanceof NpsTelegramKeyboard || keyboard instanceof NpsTelegramInlineKeyboard) {
            keyboardOptions = keyboard.GetTelegramMessageOptionsFormatting()
        }
        return Object.assign(keyboardOptions, options || {})
    }

    SendMessage = async (content, options, keyboard) => {
        try {
            const allOptions = this.GetMessageOptions(options, keyboard)
            await bot.sendMessage(this.id, content, allOptions)
        } catch(e) {
            logger.error(`Failed to send message to user ${this.id}\n${e}`);
        }
    };

    SendVideo = async (file, content, options, keyboard) => {
        try {
            const allOptions = this.GetMessageOptions(options, keyboard, {caption: content})
            await bot.sendMessage(this.id, file, allOptions)
        } catch(e) {
            logger.error(`Failed to send message to user ${this.id}\n${e}`);
        }
    };

    askInputResolve = (response) => {
        if (!this.askInput) {
            return
        }
        this.askInputResolveFn(response);
        this.askInput = false
    }

    AskInput = async (inputDetails) => {
        await this.SendMessage(inputDetails);
        this.askInput = true
        return new Promise((resolve, reject) => {
            this.askInputResolveFn = resolve
            this.askInputRejectFn = reject
            setTimeout(() => {
                if (!this.askInput) return;

                this.askInputRejectFn("Vous avez mis trop de temps pour répondre.");
                this.SendMessage("Vous avez mis trop de temps pour répondre.");
                this.askInput = false
            }, NpsAppConfig.AWAITING_INPUT_TTL)
        })
    }

    toString = () => {
        return `ID: ${this.id}, Type: ${this.type}, ExtraData: ${this.extraData}`
    }
}

module.exports = NpsTelegramChat;