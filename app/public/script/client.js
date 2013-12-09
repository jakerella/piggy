
(function($) {

    window.console = (window.console || { log: function() {}, error: function() {}});

    var app = window.pig = {
        cookieName: "piggy_token",

        $messageNode: null,

        init: function(page, options) {
            options = (options || {});

            console.log("Starting piggy client on '" + page + "' page", options);

            app.$messageNode = $("aside.messages");

            if (app[page] && app[page].init && app[page].init.apply) {
                app[page].init.apply(app[page], [options]);
            }

        },

        add: {
            init: function() {
                $("form[action=\\/transaction\\/add]").on("submit", this.handleAddExpense);
            },

            handleAddExpense: function(e) {
                var form = $(e.currentTarget),
                    data = {};

                e.preventDefault();

                app.alerts.clearAll();

                form.serializeArray().forEach(function(item) {
                    data[item.name] = item.value;
                });

                if (!Number(data.amount) || data.amount < 0) {
                    app.alerts.error("Please enter an expense amount (greater than zero)");
                    return false;
                }

                // now flip the amount to negative
                data.amount = Number(data.amount) * -1;

                app.trans.add(data, {
                    success: function(trans) {
                        console.log(trans);
                        app.alerts.success("Expense added successfully!");
                        form.find("[name=description]").val("");
                        form.find("[name=amount]").val("").focus();
                    },
                    error: function(err) {
                        app.alerts.error(err);
                    }
                });

                return false;
            }

        },

        login: {
            init: function() {
                $("form[action=\\/account\\/login]").on("submit", function(e) {
                    console.error("Login form submission (should not occur)");
                    e.preventDefault();
                    return false;
                });

                $(".pattern-lock").patternInput({
                    onFinish: this.handleLoginPattern
                });
            },

            handleLoginPattern: function(pattern) {
                console.log("login pattern", pattern);
            }
        },

        trans: {
            add: function(data, cb) {
                var cat,
                    valid = true;

                console.log("adding transaction with", data);

                cb = (cb || {});

                if (!data.amount || !Number(data.amount)) {
                    app.alerts.error("Please enter a number for the amount");
                    valid = false;
                }
                if (!data.date || !Date(data.date)) {
                    app.alerts.error("Please enter a valid date");
                    valid = false;
                }
                cat = Number(data.category);
                if (!cat && cat !== 0) {
                    app.alerts.error("Please select a valid category");
                    valid = false;
                }

                if (!valid) { return; }

                $.ajax({
                    url: "/transaction/add",
                    type: "post",
                    data: data,
                    dataType: "json",
                    success: app.ajaxSuccess(cb.success, cb.error),
                    error: app.ajaxError(cb.error)
                });

            }
        },

        ajaxSuccess: function(success, error) {
            success = (success || function() {});
            error = (error || function() {});
            return function(data) {
                data = (data || {});
                if (data.error) {
                    (app.ajaxError(error))({
                        responseText: JSON.stringify(data),
                        status: data.status
                    });
                } else {
                    success(data);
                }
            };
        },

        ajaxError: function(handler) {
            handler = (handler || function() {});
            return function(xhr) {
                var errJSON;
                try {
                    errJSON = JSON.parse(xhr.responseText);
                } catch(err) {
                    errJSON = {
                        error: xhr.responseText,
                        status: xhr.status
                    };
                }

                if (errJSON.status === 404) {
                    console.error("Unable to find endpoint (404)", errJSON.error);
                    handler("Sorry, but I couldn't complete that request");
                } else if (errJSON.status && errJSON.status < 500) {
                    handler(errJSON.error);
                } else {
                    console.error("Server error: ", errJSON.error);
                    handler("Sorry, but I couldn't complete that request");
                }
            };
        },

        alerts: {
            error: function(msg) { this.add("error", msg); },
            warn: function(msg) { this.add("warn", msg); },
            info: function(msg) { this.add("info", msg); },
            success: function(msg) { this.add("success", msg); },

            add: function(cls, msg) {
                app.$messageNode.append("<p class='" + cls + "'>" + msg + "</p>");
            },

            clearAll: function() {
                app.$messageNode.get(0).innerHTML = "";
            }
        }

    };
    

})(window.jQuery);