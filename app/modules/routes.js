
var e = require("./errors.js"),
    Account = require("./Account.js"),
    Categories = require("../../categories.json"),
    currAccount;

require("date-utils");

var self = {

    hasToken: function (req, res, next) {
        if (req.session.account) {
            currAccount = new Account(req.session.account, function(err) {
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

    showLoginPage: function(req, res) {
        var loc = "/main";
        if (req.query.l && req.query.l.length > 1) {
            loc = req.query.l;
        }
        res.render("login", { title: "Login", page: "login", location: escape(loc) });
    },

    redirectToAccountPage: function(req, res) {
        res.redirect("/main#page_account");
    },
    redirectToExpensePage: function(req, res) {
        res.redirect("/main#page_expense");
    },
    redirectToDepositPage: function(req, res) {
        res.redirect("/main#page_deposit");
    },

    showMainPage: function(req, res, next) {
        var now = new Date();

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

                res.render("main", {
                    title: "Account",
                    page: "acct",
                    account: currAccount,
                    today: now.toFormat("YYYY-MM-DD"),
                    monthStart: (now.getFullYear() + "-" + now.toFormat("MM") + "-01"),
                    categories: Categories,
                    transactions: transactions
                });
            }
        );
    },
    
    findTransactions: function(req, res, next) {
        
        currAccount.getTransactions({
                query: req.query.filter || null,
                options: {
                    skip: req.query.skip || 0,
                    limit: req.query.limit || 10,
                    sort: [[(req.query.sort || "date"), (req.query.sortDir || "desc")]]
                }
            },
            function(err, transactions) {
                if (err) { next(err); return; }
                
                res.writeHead(200, {"Content-Type": "application/json"});
                res.end(JSON.stringify(transactions));
            }
        );
    },

    getAccountReport: function(req, res, next) {
        var data = {
            type: "",
            totals: {
                deposits: 0,
                expenses: 0
            },
            categories: [],
            transactions: []
        };
        
        if (req.query.category) {
            currAccount.getTransactions(
                {
                    query: req.query,
                    options: {
                        sort: [["date", "desc"]]
                    }
                },
                function(err, results) {
                    if (err) { return next(err); }
                    
                    data.type = "list";
                    data.transactions = results;
                    
                    results.forEach(function(trans) {;
                        if (trans.amount > 0) {
                            data.totals.deposits += trans.amount;
                        } else {
                            data.totals.expenses += trans.amount;
                        }
                    });

                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(data));
                }
            );
            
        } else {
            currAccount.getTransactionTotals(
                req.query,
                function(err, results) {
                    if (err) { return next(err); }
                    
                    data.type = "pie";
                    
                    results.categoryTotals.forEach(function(category) {
                        var total = category.total;

                        category.name = Categories[category.category];

                        if (category.category === 0) {
                            total = Math.abs(category.total);
                            data.totals.deposits += category.total;
                        } else {
                            data.totals.expenses += category.total;
                        }

                        data.categories.push({
                            label: category.name,
                            data: total
                        });
                    });

                    res.writeHead(200, {"Content-Type": "application/json"});
                    res.end(JSON.stringify(data));
                }
            );
        }
    },


    // ----------------- POST/DELETE Requests --------------- //

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
        currAccount.addTransaction(req.body, function transAdded(err, trans, acct) {
            if (err) { next(err); return; }

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
                transaction: trans,
                account: acct
            }));
        });
    },

    deleteTransaction: function(req, res, next) {
        // I have no idea why, but for some reason, even though the router matched
        // our path, req.params is empty. Instead, we'll use the path...
        var id = req.path.split(/\//)[2];

        currAccount.deleteTransaction(id, function transDeleted(err, trans, acct) {
            if (err) { next(err); return; }

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
                account: acct,
                transactionId: trans._id
            }));
        });
    }


};

module.exports = self;
