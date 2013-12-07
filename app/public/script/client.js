
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
            init: function(options) {
                var expForm = document.querySelector("[action=\\/transaction\\/add]");

                expForm.addEventListener("submit", this.handleAddExpense);
            },

            handleAddExpense: function(e) {
                var data = {};

                app.alerts.clearAll();

                $(e.currentTarget).serializeArray().forEach(function(item) {
                    data[item.name] = item.value;
                });

                app.trans.add(data, {
                    success: function(trans) {
                        console.log(trans);
                        app.alerts.success("Expense added successfully!");
                    },
                    error: function(err) {
                        app.alerts.error(err);
                    }
                });

                e.preventDefault();
                return false;
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
                    success: (cb.success || null),
                    error: app.ajaxError(cb.error)
                });

            }
        },

        ajaxError: function(handler) {
            handler = (handler || function() {});
            return function(xhr) {
                if (xhr.status === 404) {
                    console.error("Unable to find endpoint (404)");
                    handler("Sorry, but I couldn't complete that request");
                } else if (xhr.status < 500) {
                    handler(xhr.responseText);
                } else {
                    console.error("Server error: ", xhr.responseText);
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