
var e = require("./errors.js"),
    Account = require("./Account.js"),
    Categories = require("../../categories.json"),
    currAccount;

require("date-utils");

var self = {

    hasToken: function (req, res, next) {
        if (req.session.account) {
            currAccount = new Account(req.session.account, function(err, acct) {
                if (err) { next(err); return; }
                next();
            });
        } else if (req.xhr) {
            next(new e.AuthError("Sorry, but you'll need to log in before continuing"));
        } else {
            res.redirect("/account/login?l=" + req.url);
        }
    },

    // ----------------- GET Requests --------------- //

    index: function(req, res) {
        res.render("index", { title: "Home", page: "home" });
    },

    showLoginPage: function(req, res) {
        var loc = "/account";
        if (req.query.l) {
            loc = req.query.l;
        }
        res.render("login", { title: "Login", page: "login", location: escape(loc) });
    },

    showAccountSummary: function(req, res, next) {
        currAccount.getTransactions(
            {
                query: null,
                options: {
                    limit: 10,
                    sort: [["date", "desc"]]
                }
            },
            function(err, transactions) {
                if (err) { next(err); return; }

                res.render("account", {
                    title: "Account",
                    page: "acct",
                    account: currAccount,
                    today: (new Date()).toFormat("M/D/YYYY"),
                    categories: Categories,
                    transactions: transactions
                });
            }
        );
    },

    showAddPage: function(req, res, next) {
        res.render("add", {
            title: "Add Transaction",
            page: "add-trans",
            account: currAccount,
            today: (new Date()).toFormat("M/D/YYYY"),
            categories: Categories
        });
    },


    // ----------------- POST Requests --------------- //

    doAccountLogin: function(req, res, next) {
        Account.doLogin(req.body, function(err, account) {
            if (err) { next(err); return; }

            req.session.account = account._id;
            currAccount = account;

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
                _id: account._id,
                owner: account.owner,
                balance: account.balance
            }));
        });

    },

    addTransaction: function(req, res, next) {
        currAccount.addTransaction(req.body, function transAdded(err, trans) {
            if (err) { next(err); return; }

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(trans));
        });
    }


};

module.exports = self;
