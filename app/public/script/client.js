
(function($) {

    window.console = (window.console || { log: function() {}, error: function() {}});

    var app = window.pig = {
        categories: {},
        $messageNode: null,

        init: function(page, options) {
            options = (options || {});

            console.log("Starting piggy client on '" + page + "' page", options);

            app.$messageNode = $("aside.messages");

            if (app[page] && app[page].init && app[page].init.apply) {
                app[page].init.apply(app[page], [options]);
            }

        },

        main: {
            init: function() {
                app.main.$acctBalance = $("#page_account .amount");
                app.main.$recentTrans = $("div.recentTrans");
                app.main.$recentTransCount = $(".recentTransCount");

                $("form[action=\\/transaction\\/add]")
                    .on("submit", this.handleAddTransaction)
                    .find("[required]")
                        .on("invalid", function() {
                            $(this)
                                .closest("form")
                                    .find(".ui-submit")
                                        .removeClass("ui-btn-active");
                        });
            },

            handleAddTransaction: function(e) {
                var form = $(this),
                    data = {};

                e.preventDefault();

                app.alerts.clearAll();

                form.serializeArray().forEach(function(item) {
                    data[item.name] = item.value;
                });

                if (!Number(data.amount)) {
                    app.alerts.error("Please enter an amount (greater than zero)");
                    form.find(".ui-submit").removeClass("ui-btn-active");
                    return false;
                }
                data.amount = Number(data.amount);

                // if an expense, flip the amount to negative
                if (form.find("[name=amount]").hasClass("expense") && data.amount > 0) {
                    data.amount *= -1;
                }

                app.trans.add(data, {
                    success: function(trans) {
                        console.log(trans);
                        
                        var balance = Number(app.main.$acctBalance.text().substr(1)),
                            transDiv = $("<div data-role='collapsible' class='ui-first-child' />");
                        
                        if (balance) {
                            app.main.$acctBalance.text("$" + (balance + trans.amount).toFixed(2));
                        }

                        app.main.$recentTrans.find(".ui-first-child").removeClass("ui-first-child");

                        transDiv.append(
                            "<h3>$" + trans.amount.toFixed(2) + " " + trans.dateDisplay + "</h3>" +
                            "<p class='description'>" + trans.description + "</p>" +
                            "<p class='category'>" + app.categories[trans.category] + "</p>"
                        );
                        app.main.$recentTrans.prepend(transDiv);
                        transDiv.collapsible();
                        app.main.$recentTransCount.text(Number(app.main.$recentTransCount.text()) + 1);

                        app.alerts.success("Transaction added successfully!");
                        form.find("[name=description]").val("");
                        form.find("[name=amount]").val("").focus();
                        form.find(".ui-submit").removeClass("ui-btn-active");
                    },
                    error: function(err) {
                        app.alerts.error(err);
                        form.find(".ui-submit").removeClass("ui-btn-active");
                    }
                });

                return false;
            }

        },

        login: {
            $account: null,
            $lock: null,

            init: function() {
                var loc;

                $("form[action=\\/account\\/login]").on("submit", function(e) {
                    console.error("Login form submission (should not occur)");
                    e.preventDefault();
                    return false;
                });

                app.login.$account = $("[name=account]");
                app.login.$lock = $(".pattern-lock");

                if (window.location.hash) {
                    loc = $("[name=location]");
                    loc.val(loc.val() + window.location.hash);
                }

                if (localStorage.account && !app.login.$account.val().length) {
                    app.login.$account.val(localStorage.account).blur();
                }

                app.login.$lock.patternInput({
                    onFinish: this.handleLoginPattern
                });

                $("body").on("touchmove", function(e) {
                    // makes the pattern lock UI work on touch devices
                    e.preventDefault();
                });
            },

            handleLoginPattern: function(pattern) {
                app.alerts.clearAll();

                app.login.$account.attr("disabled", "disabled");
                app.login.$lock.hide();

                app.alerts.info("Working...");

                $.ajax({
                    url: "/account/login",
                    type: "post",
                    data: {
                        owner: app.login.$account.val(),
                        pattern: pattern.join("")
                    },
                    dataType: "json",
                    success: app.ajaxSuccess(app.login.success, app.login.error),
                    error: app.ajaxError(app.login.error)
                });
            },

            success: function() {
                localStorage.account = app.login.$account.val();
                window.location.replace($("[name=location]").val());
            },

            error: function(err) {
                app.alerts.clearAll();
                app.alerts.error(err);
                app.login.$lock.show();
                app.login.$account.removeAttr("disabled");
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
                app.$messageNode.empty();
            }
        }

    };
    

})(window.jQuery);