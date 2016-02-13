
require("date-utils");

var e = require("./errors.js"),
    mongo = require("./mongo-helper.js"),
    Categories = require("../../categories.json"),
    ObjectID = require("mongodb").ObjectID,
    crypto = require("crypto"),

    // Private vars
    SALT = "j34&Fj69*&4hL#W0",

    // Private Helper declarations
    createTransaction,
    deleteTransaction,
    updateAccount,
    getPatternHash,

// Main class
Account = function(id, cb, instance) {
    var self = this,
        oid = id;

    cb = (cb && cb.isFunction()) ? cb : function() {};

    if (instance) {
        self._id = instance._id;
        self.owner = instance.owner;
        self.balance = instance.balance;

        self.dbInstance = instance;

        return self;
    }

    if (id && id.$oid) {
        oid = id.$oid;
    }

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb(err); return; }

        mongo.getOrCreateCollection(db, "account", function(err, coll) {
            if (err) { cb(err, null); return; }
            
            coll.findOne({ "_id": new ObjectID(oid) }, function(err, acct) {
                if (err) { cb(err, null); return; }

                self._id = acct._id;
                self.owner = acct.owner;
                self.balance = acct.balance;

                self.dbInstance = acct;

                cb(null, self);
            });
        });
    });

};

// --------------- Account methods --------------- //

Account.doLogin = function(data, cb) {
    data = (data || {});
    cb = (cb && cb.isFunction()) ? cb : function() {};

    if (!data.owner || !data.owner.length) {
        cb(new e.BadRequestError("Please enter the account name"));
        return;
    }
    if (!data.pattern || !data.pattern.length) {
        cb(new e.BadRequestError("Please enter the account pattern"));
        return;
    }

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb(err); return; }

        mongo.getOrCreateCollection(db, "account", function(err, coll) {
            if (err) { cb(err, null); return; }
            
            coll.findOne({ "owner": data.owner }, function(err, acct) {
                var acctObj;

                if (err) { cb(err, null); return; }

                if (acct && acct.pattern === getPatternHash(data.owner, data.pattern)) {
                    acctObj = new Account(null, null, acct);

                    cb(null, acctObj);
                    
                } else {
                    cb(new e.AuthError("Sorry, but that account name and pattern do not match"));
                }
            });
        });
    });
};

Account.prototype.addTransaction = function(data, cb) {
    var self = this;

    data = (data || {});
    cb = (cb && cb.isFunction()) ? cb : function() {};

    // Always use the currently logged in account
    data.account = self._id;

    // Data type checking
    data.amount = Number(data.amount);
    if (/^20[0-9]{2}\-[0-9]{2}\-[0-9]{2}$/.test(data.date)) {
        data.date += "T12:00:00";
    }
    data.date = new Date(data.date);
    data.description = (data.description || "");
    data.category = Number(data.category);

    // Data audits
    if (!data.amount) {
        cb(new e.BadRequestError("Please enter a non-zero amount for this transaction"));
        return;
    }
    if (!Categories[data.category]) {
        cb(new e.BadRequestError("Please select a valid category"));
        return;
    }
    if (!data.date) {
        // Default to today
        data.date = new Date();
    }

    data.date = data.date.getTime();
    data.createTime = (new Date()).getTime();

    // Do the DB updates
    createTransaction(data, function(err, trans) {
        if (err) {
            cb(err);
            return;
        }

        self.dbInstance.balance = self.balance = (self.balance + trans.amount);

        updateAccount(self.dbInstance, function(err, acct) {
            if (err) {
                console.error("Transaction added, but account balance change error: ", err);
                cb(err);
                return;
            }

            trans.dateDisplay = (new Date(trans.date)).toFormat("M/D/YYYY");
            trans.timeDisplay = (new Date(trans.date)).toFormat("H:MI P");
            trans.createTimeDisplay = (new Date(trans.createTime)).toFormat("M/D/YYYY");

            cb(null, trans, acct);
        });
    });
};

Account.prototype.deleteTransaction = function(oid, cb) {
    var amount = 0,
        self = this;

    cb = (cb && cb.isFunction()) ? cb : function() {};

    console.log("Deleting transaction ID: " + oid);

    self.findTransaction(oid, function(err, transaction) {
        if (err) { cb( e.getErrorObject(err) ); return; }

        amount = transaction.amount;

        deleteTransaction(oid, self._id, function(err) {
            if (err) { cb( e.getErrorObject(err) ); return; }

            console.log("Transaction deleted: " + oid);

            self.dbInstance.balance = self.balance = (self.balance + (amount * -1));

            updateAccount(self.dbInstance, function(err, acct) {
                if (err) {
                    console.error("Transaction deleted, but account balance change error: ", err);
                    cb(err);
                    return;
                }

                cb(null, transaction, acct);
            });

        });
    });
};

Account.prototype.findTransaction = function(oid, cb) {
    var self = this;

    cb = (cb && cb.isFunction()) ? cb : function() {};

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb( e.getErrorObject(err) ); return; }

        mongo.getOrCreateCollection(db, "transaction", function(err, coll) {
            if (err) { cb( e.getErrorObject(err) ); return; }

            coll
                .findOne({ _id: new ObjectID(oid), account: self._id }, function(err, transaction) {
                    if (err) { cb( e.getErrorObject(err) ); return; }

                    if (!transaction) {
                        cb( new e.BadRequestError("Please select a valid transaction to delete") );
                        return;
                    }

                    transaction.dateDisplay = (new Date(transaction.date)).toFormat("M/D/YYYY");
                    transaction.timeDisplay = (new Date(transaction.date)).toFormat("H:MI P");
                    transaction.createTimeDisplay = (new Date(transaction.createTime || transaction.date)).toFormat("M/D/YYYY");

                    cb(null, transaction);
                    return;
                });
        });
    });
};

Account.prototype.getTransactions = function(data, cb) {
    var query = {};
    
    data = (data || {});
    cb = (cb && cb.isFunction()) ? cb : function() {};

    query.account = this._id;
    
    dates = getQueryDateRange(data);
    if (dates.start || dates.end) {
        query.date = {}
        if (dates.start) {
            query.date.$gte = dates.start;
        }
        if (dates.end) {
            query.date.$lte = dates.end;
        }
    }
    
    if (data.query && data.query.category) {
        query.category = Number(data.query.category);
    }
    
    console.info('Finding transactions', query);

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb( e.getErrorObject(err) ); return; }

        mongo.getOrCreateCollection(db, "transaction", function(err, coll) {
            if (err) { cb( e.getErrorObject(err) ); return; }

            coll
            .find(query, (data.options || null))
            .toArray(function(err, transactions) {
                if (err) { cb( e.getErrorObject(err) ); return; }

                transactions.forEach(function(trans) {
                    trans.dateDisplay = (new Date(trans.date)).toFormat("M/D/YYYY");
                    trans.timeDisplay = (new Date(trans.date)).toFormat("H:MI P");
                    trans.createTimeDisplay = (new Date(trans.createTime || trans.date)).toFormat("M/D/YYYY");
                });

                cb(null, transactions);
                return;
            });
        });
    });
};

Account.prototype.getTransactionTotals = function(data, cb) {
    var d, dates,
        query = {};

    data = (data || {});
    cb = (cb && cb.isFunction()) ? cb : function() {};
    
    query.account = this._id;
    dates = getQueryDateRange(data);
    if (dates.start || dates.end) {
        query.date = {}
        if (dates.start) {
            query.date.$gte = dates.start;
        }
        if (dates.end) {
            query.date.$lte = dates.end;
        }
    }
    if (data.category) {
        query.category = Number(data.category);
    }

    console.log("searching for ", JSON.stringify(query));

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb( e.getErrorObject(err) ); return; }

        mongo.getOrCreateCollection(db, "transaction", function(err, coll) {
            if (err) { cb( e.getErrorObject(err) ); return; }

            coll
            .group(
                { "category": 1 },
                query,
                { total: 0 },
                function(curr, result) { result.total += curr.amount; },
                function(){},
                true,
                {},
                function(err, results) {
                    if (err) { cb( e.getErrorObject(err) ); return; }
                    
                    cb(null, { categoryTotals: results });
                }
            );
        });
    });
};

function getQueryDateRange(data) {
    var d,
        start = null,
        end = null,
        now = new Date();
    
    if (data.dateStart && !Number(data.dateStart)) {
        d = new Date(data.dateStart);
        if (!d) {
            d = new Date(now.getFullYear() + "-" + now.toFormat("MM") + "-01");
        }
        start = d.getTime();
        
    }
    
    if (data.dateEnd && !Number(data.dateEnd)) {
        d = new Date(data.dateEnd);
        if (!d) {
            d = now;
        }
        end = d.getTime();
        
    }
    
    return {
        start: start,
        end: end
    };
}


module.exports = Account;


// ---------------- Private helpers ---------------- //

getPatternHash = function(owner, pattern) {
    var sha256 = crypto.createHash("sha256");

    sha256.update(SALT + owner + SALT + pattern);
    return sha256.digest("hex");
};

createTransaction = function(data, cb) {
    cb = (cb && cb.isFunction()) ? cb : function() {};

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb(err); return; }

        mongo.getOrCreateCollection(db, "transaction", function(err, coll) {
            if (err) { cb(err, null); return; }

            coll.insert(
                data,
                function(err, result) {
                    if (err) { cb(err, null); return; }
                    console.log('Added transaction:', data, result);
                    cb(null, data);
                    return;
                }
            );
        });
    });
};

deleteTransaction = function(oid, accountId, cb) {
    cb = (cb && cb.isFunction()) ? cb : function() {};

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb(err); return; }

        mongo.getOrCreateCollection(db, "transaction", function(err, coll) {
            if (err) { cb(err, null); return; }

            coll.remove(
                { _id: new ObjectID(oid), account: accountId },
                function(err) {
                    if (err) { cb(err, null); return; }

                    cb(null);
                }
            );
        });
    });
};

updateAccount = function(data, cb) {
    cb = (cb && cb.isFunction()) ? cb : function() {};

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb(err); return; }

        mongo.getOrCreateCollection(db, "account", function(err, coll) {
            if (err) { cb(err, null); return; }
            
            coll.update(
                { _id: data._id },
                data,
                { safe: true },
                function(err, count) {
                    if (err) { cb(err, null); return; }

                    cb(null, data, count);
                }
            );
        });
    });

};
