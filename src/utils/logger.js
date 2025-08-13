const winston = require('winston');
const { combine, timestamp, printf, colorize } = winston.format;
const dotenv = require('dotenv')
dotenv.config()

let getFileFormatDate = () => {
    const date = new Date()
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
  
    const formattedDay = day < 10 ? '0' + day : day;
    const formattedMonth = month < 10 ? '0' + month : month;

    // const formattedDate = `${formattedDay}-${formattedMonth}-${year}_${formattedHours}-${formattedMinutes}-${formattedSeconds}`;
    const formattedDate = `${formattedDay}-${formattedMonth}-${year}`;
  
    return formattedDate;
};

const current_time = getFileFormatDate()
let logger

if (!logger) {
    try {
        logger = winston.createLogger({
            level: (process.env.NODE_ENV == "dev") && 'debug' || 'info',
            
            format: combine(
              colorize({all:true}),
              timestamp(),
              printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
            ),
            transports: [
              new winston.transports.Console(),
              new winston.transports.File({ filename: `./logs/${current_time}.log` })
            ]
        });
    } catch (err) {
        throw new Error(err)
    }
}

module.exports = logger;