
var e = require("./errors.js"),
mongo = require("./mongo-helper.js"),
ObjectID = require("mongodb").ObjectID,

createTransaction,

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
                cb(null, self);
            });
        });
    });

};

// --------------- Account methods --------------- //

Account.prototype.addTransaction = function(data, callback) {

    // TODO: add the transaction to this account

    data.account = this._id;

    createTransaction(data, callback);

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
