
var e = require("./errors.js"),
    mongo = require("./mongo-helper.js");

var Account = function(id) {

    // TOOD: get the account by ID

    this.id = id;
    this.owner = "Jordan";

};

Account.prototype.addTransaction = function(data, callback) {

    // TODO: add the transaction to this account

    callback(null, data);

};

module.exports = Account;
