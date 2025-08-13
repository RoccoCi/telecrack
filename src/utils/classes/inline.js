const {v6: uuidv6} = require('uuid');
const logger = require('../logger');

const inline_keyboards = {}

class NpsTelegramInlineKeyboard {
    constructor(id) {
        if (id && inline_keyboards[id]) return inline_keyboards[id];

        this.id = Object.keys(inline_keyboards).length++ // REMPLACER PAR L'IDENTIFIANT DU MESSAGE CONTENANT L'INLINE ?
        this.buttons = []
        this.callbacks = {}
        this.disabled = {}

        this.linked_chat_id = null
        this.linked_message_id = null
        this.linked_message_thread_id = null

        this.multiple_choices = false

        inline_keyboards[this.id] = this
    }

    static CanProcessButtonsFormat = (buttonData) => {
        if (typeof(buttonData)==="object" && typeof(buttonData?.text)==="string" && typeof(buttonData?.callbackFn)==="function") {
            return true
        } else {
            return false
        }
    }

    FormatButtonCallbackName = (callbackUid) => {
        if (typeof(callbackUid)==="string") {
            return `${this.id}_${callbackUid}`
        } else {
            logger.error("Failed to format callback name, callbackUid is not defined");
            return
        }
    }

    RegisterCallback = (cbFn) => {
        if (typeof(cbFn)!="function") {
            logger.error("RegisterCallback can't be executed, callback is not a function")
            return
        }

        const callbackUid = uuidv6();
        const callbackName = this.FormatButtonCallbackName(callbackUid);
        
        this.callbacks[callbackUid] = cbFn

        return {name: callbackName, uid: callbackUid}
    }

    AddButton = (text, callbackFn) => {
        // if (!this.CanProcessButtonsFormat({text, callbackFn})) {
        //     logger.error("AddButton can't be executed, text or callbackFn (or both) invalid")
        //     return
        // }

        const buttonCallbackData = this.RegisterCallback(callbackFn);
        this.buttons.push([{text, callback_data: buttonCallbackData.name}]);

        return buttonCallbackData.uid
    }

    AddRowButtons = (buttonsArray) => {
        const nButtons = []
        const buttonsCallbacks = []
        let buttonIdx = 0
        buttonsArray.forEach((buttonData) => {
            // if (!this.CanProcessButtonsFormat(buttonData)) {
            //     logger.error(`AddRowButtons can't be executed, button at index ${buttonIdx} isn't valid`)
            //     return
            // }

            const buttonCallbackData = this.RegisterCallback(callbackFn);
        
            nButtons.push({text: buttonData.text, callback_data: buttonCallbackData.name})
            buttonsCallbacks.push(buttonCallbackData.uid)

            buttonIdx+=1
        });

        this.buttons.push([...nButtons]);
        return buttonsCallbacks;
    }

    ExecuteCallback = async (callbackUid, Event, ...args) => {
        const callbackFn = this.callbacks[callbackUid]

        if (!callbackFn) {
            logger.error(`Callback function timed out for ${callbackUid}`);
            return
        }

        if (this.disabled[callbackUid]) {
            logger.warn(`Callback ${callbackUid} is disabled`)
            return
        }

        logger.debug("Executing callback as layer 1")
        Event.debug()

        try {
            this.linked_chat_id = Event.chat.GetId();
            this.linked_message_thread_id = Event?.message_thread_id
            this.linked_message_id = Event?.message_id

            logger.warn(`Executing callback ${callbackUid}`)
            await callbackFn(Event, args);
            logger.warn(`Callback executed`)

            if (!this.multiple_choices) {
                // this.callbacks = {}
                // ENLEVER LE INLINE DU MESSAGE ?
            }
        } catch (e) {
            logger.warn(`Failed to execute inline keyboard callback\n${e}`)
        }
    }

    GetButtons = () => {
        return this.buttons
    }

    GetType = () => {
        return "inline_keyboard"
    }
    
    GetTelegramMessageOptionsFormatting = () => {
        return {
            reply_markup: {
                inline_keyboard: this.GetButtons()
            }
        }
    }

    Disable = (callbackUid) => {
        delete this.callbacks[callbackUid];
        this.disabled[callbackUid] = true
    } // CODER CETTE FONCTION

    IsDisabled = (callbackUid) => {
        return this.disabled[callbackUid];
    }

    SetMultiple = (bool) => {
        this.multiple_choices = bool
    } // Ne supprime pas les autres callbacks lorsqu'un est executé

    SetOptions = (optionsObject) => {
        this.options = optionsObject;
    }

    GetOptions = () => {
        return this.options
    }
}

// [
//  [{}, {}],
//  [{}],
// ]

module.exports = NpsTelegramInlineKeyboard;