const {NpsAppConfig} = require('../../configs/index');
const logger = require('../logger');
const bot = require('../bot-api');

const NpsTelegramKeyboard = require('./keyboard');
const NpsTelegramInlineKeyboard = require('./inline');
const NpsTelegramInput = require('./input');

//ENFANT DE LA CLASSE User QUI DEVRA AVOIR UN bot.getChatMember DANS SON CONSTRUCTOR OU QUI SE FAIT AUTOMATIQUEMENT LORS D'UNE REQUETE A UNE FONCTION NECESSITANT LES DONNEES TELEGRAM
const usersMemoization = {}

class NpsTelegramUser {
    constructor(userData) {
        if (!userData?.id) {
            logger.warn(`Failed to get user (no user id)`)
            return 
        }

        if (usersMemoization[userData?.id]) return usersMemoization[userData?.id];

        this.id = userData?.id
        this.username = userData?.username
        this.extraData = userData
        this.askInput = null

        usersMemoization[this.id] = this
    }

    GetId = () => {
        return this.id
    }

    GetUsername = () => {
        return this?.username
    }

    HaveUsername = () => {
        return this?.username!=undefined
    }

    GetMessageOptions = (options, keyboard, extra) => {
        let keyboardOptions = {}
        if (keyboard instanceof NpsTelegramKeyboard || keyboard instanceof NpsTelegramInlineKeyboard) {
            keyboardOptions = keyboard.GetTelegramMessageOptionsFormatting()
        }

        return Object.assign(keyboardOptions, options || {}, extra || {})
    }

    SendMessage = async (content, options, keyboard) => {
        try {
            const allOptions = this.GetMessageOptions(options, keyboard)
            return await bot.sendMessage(this.id, content, allOptions)
        } catch(e) {
            logger.error(`Failed to send message to user ${this.id}\n${e}`);
        }
    };

    SendVideo = async (file, content, options, keyboard) => {
        try {
            const allOptions = this.GetMessageOptions(options, keyboard, {caption: content})
            logger.info(allOptions)
            await bot.sendVideo(this.id, file, allOptions)
        } catch(e) {
            logger.error(`Failed to send message to user ${this.id}\n${e}`);
        }
    };

    // SendKeyboardMessage = async (content, keyboard, options) => {
    //     try {
    //         const allOptions = Object.assign({
    //             reply_markup: {
    //                 keyboard: keyboard.GetButtons()
    //             }
    //         }, options)
    //         await bot.sendMessage(this.id, content, allOptions)
    //     } catch(e) {
    //         logger.error(`Failed to send keyboard message to user ${this.id}\n${e}`)
    //     }
    // };

    // SendInlineKeyboardMessage = async (content, inlineKeyboardObject, inline_keyboard_options) => {
    //     try {
    //         await bot.sendMessage(this.id, content, {
    //             reply_markup: {
    //                 inline_keyboard: inlineKeyboardObject.GetButtons()
    //             }
    //         })
    //     } catch (e) {
    //         logger.error(`Failed to execute InlineKeyboardMessage\n${e}`)
    //     }
    // };

    AwaitInput = async (inputType, instructionsString) => {
        await this.SendMessage(instructionsString)
        const userInput = new NpsTelegramInput(this.id, inputType, instructionsString)
        return userInput.ExecuteInputPromise();
    }






    ////////////////////////////////////////////////////////////////////////
    #askInputTimeoutReject = () => {
        if (!this.askInput) {
            return
        }

        this.SendMessage("Vous avez pris trop de temps pour répondre, veuillez recommencer votre intéraction.")
        this.askInput = false
        this.inputRejecter(false)
    }

    askInputResolve = (result) => {
        if (!this.askInput) {
            return
        }
        logger.debug("Resolving ask input")
        this.askInput = false
        this.inputResolver(result)
    }

    #ReceiveInputPromise = (resolve, reject) => {
        this.inputResolver = resolve
        this.inputRejecter = reject
        setTimeout(this.#askInputTimeoutReject, NpsAppConfig.AWAITING_INPUT_TTL);
    }

    AskInput = async (type, inputDetails) => {
        await this.SendMessage(inputDetails);
        this.askInput = true
        return new Promise(this.#ReceiveInputPromise)
    }

    CancelAskInput = async (cancelInputDetails) => {
        if (!this.askInput) {
            return
        }

        if (typeof(cancelInputDetails)==="string") {
            await this.SendMessage(cancelInputDetails);
        }
        this.askInput = false
    }
    ////////////////////////////////////////////////////////////////////////

    toString = () => {
        return `ID: ${this.id}, Username: ${this?.username ? this.username : "Non-existent"}, ExtraData: ${this.extraData}`
    }
}

module.exports = NpsTelegramUser;