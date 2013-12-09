
var e = require("./errors.js"),
mongo = require("./mongo-helper.js"),
Categories = require("../../categories.json"),
ObjectID = require("mongodb").ObjectID,

// Private Helper declarations
createTransaction,
updateAccount,

// Main class
Account = function(id, cb) {
    var self = this,
        oid = id;

    cb = (cb && cb.isFunction()) ? cb : function() {};

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

Account.prototype.addTransaction = function(data, cb) {
    var self = this;

    data = (data || {});
    cb = (cb && cb.isFunction()) ? cb : function() {};

    // Always use the currently logged in account
    data.account = self._id;

    // Data type checking
    data.amount = Number(data.amount);
    data.date = new Date(data.date);
    data.description = (data.description || "");
    data.category = Number(data.category);

    // Data audits
    if (!data.amount) {
        cb(e.BadRequestError("Please enter a non-zero amount for this transaction"));
        return;
    }
    if (!Categories[data.category]) {
        cb(e.BadRequestError("Please select a valid category"));
        return;
    }
    if (!data.date) {
        // Default to today
        data.date = new Date();
    }

    data.date = data.date.getTime();

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

            cb(null, trans, acct);
        });
    });
};


module.exports = Account;


// ---------------- Private helpers ---------------- //

createTransaction = function(data, cb) {
    cb = (cb && cb.isFunction()) ? cb : function() {};

    mongo.connect(Account.prototype, function(err, db) {
        if (err) { cb(err); return; }

        mongo.getOrCreateCollection(db, "transaction", function(err, coll) {
            if (err) { cb(err, null); return; }

            coll.insert(
                data,
                function(err, recs) {
                    if (err) { cb(err, null); return; }
                    cb(null, recs[0]);
                    return;
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

                    cb(null, data);
                }
            );
        });
    });

};
