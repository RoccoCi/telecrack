const NpsTelegramEvent = require("./event");
const {NpsInputEnums} = require('../../enums/index');
const logger = require("../logger");

const inputs = {}

class NpsTelegramInput {
    constructor(chatId, type, instructions) {
        if (inputs[chatId]) return inputs[chatId];

        this.chatId = chatId
        this.type = type
        this.instructions = instructions

        inputs[chatId] = this
    }

    static GetHandlersTypes = () => {
        return Object.values(NpsInputEnums.Types);
    }

    static HandleInputs = (Event) => {
        const CurrentInput = inputs[Event.chat.GetId()];
        if (!CurrentInput) {
            logger.debug("Skipping incoming text (no input)")
            return
        }
        
        if (!Event[CurrentInput.type]) {
            logger.debug("Awaiting input but received wrong type (VERY STRANGE)")
            // Envoyer message en expliquant que c'est le mauvais format
            return
        }


        if (CurrentInput.inputResponse) {
            if (CurrentInput.type != NpsInputEnums.Types.TEXT) {
                return CurrentInput.inputResponse(Event.video.file_id)
            } else {
                return CurrentInput.inputResponse(Event.text)
            }
        }
    }

    static DoesChatAwaitInput = (chatId) => {
        return (typeof(inputs[chatId]) === "object")
    }

    ExecuteInputPromise = () => {
        return new Promise((resolve, reject) => {
            this.inputResponse = resolve
            logger.debug("Created promise checkkk")
            this.responseTimeout = reject

            setTimeout(() => {
                this.responseTimeout("Vous avez mis trop de temps a répondre");
            }, 12000)
        })
    }
}

module.exports = NpsTelegramInput;