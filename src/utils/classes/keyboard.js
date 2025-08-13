const logger = require("../logger");
const HashString = require('../hash');

const keyboards = {}

class NpsTelegramKeyboard {
    constructor(id) {
        if (keyboards[id]) return keyboards[i];
        this.id = Object.keys(keyboards).length++
        this.buttons = []
        this.callbacks = {}
        this.options = {}

        keyboards[this.id] = this
    }

    static GetHashedTextCallbackFn = (hashedText) => {
        for (const Keyboard of Object.values(keyboards)) {
            if (Keyboard.DoesCallbackExists(hashedText)) {
                return Keyboard.GetCallback(hashedText)
            }
        }

        // Object.values(keyboards).forEach(Keyboard => {
            
        //     if (Keyboard.DoesCallbackExists(hashedText)) {
        //         return Keyboard.GetCallback(hashedText)
        //     }
        // })
    }

    GetType = () => {
        return "keyboard"
    }

    AddButton = (text, callbackFn) => {
        const hashedText = HashString(text);
        
        this.buttons.push([{text}]);
        this.callbacks[hashedText] = callbackFn;

        logger.debug(`Added ${text} to callback ${hashedText}`);
    }

    AddRowButtons = (buttonsArray) => {

    }

    GetCallback = (hashedText) => {
        return this.callbacks[hashedText];
    }

    DoesCallbackExists = (hashedText) => {
        return typeof(this.callbacks[hashedText])==="function";
    }

    GetButtons = () => {
        return this.buttons
    }

    GetTelegramMessageOptionsFormatting = () => {
        const replyMarkupOptions = Object.assign({
            keyboard: this.GetButtons()
        }, this.options);

        return {
            reply_markup: replyMarkupOptions
        }
    }

    SetOptions = (optionsObject) => {
        this.options = optionsObject;
    }
}

module.exports = NpsTelegramKeyboard; 