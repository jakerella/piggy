var winston = require("winston");

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({ colorize: true }),
        new winston.transports.File({
            filename: __dirname + "/../../logs/app.log",
            level: "warn"
        })
    ]
});

console.log = logger.info;
console.error = logger.error;

module.exports = logger;