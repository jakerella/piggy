
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
                app.main.$acctBalance = $(".balance");
                app.main.$recentTrans = $("div.recentTrans");
                app.main.$confirmDelete = $("#confirmDelete");
                app.main.$totals = $(".totals");
                app.main.$reportChart = $(".reportChart");
                app.main.$reportTrans = $(".reportTrans");
                app.main.$reportDateStart = $("#dateStart");
                app.main.$reportDateEnd = $("#dateEnd");
                app.main.$reportCategory = $("#filterCategory");

                app.main.pieOptions = {
                    series: {
                        pie: { 
                            show: true,
                            label: {
                                show: true,
                                formatter: app.main.pieLabelFormatter
                            }
                        }
                    },
                    legend: {
                        show: false
                    }
                };

                $("form[action=\\/transaction\\/add]")
                    .on("submit", this.handleAddTransaction)
                    .find("[required]")
                        .on("invalid", function() {
                            $(this)
                                .closest("form")
                                    .find(".ui-submit")
                                        .removeClass("ui-btn-active");
                        });

                $("body").on("click", ".deleteTrans", this.handleDeleteTransaction);

                $("form[action=\\/account\\/report]").on("submit", this.handleReportFilter);

                // Get initial stats/report
                app.main.getAccountReport();
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
                    success: function(result) {
                        app.main.handleTransactionAddSuccess(result, form);
                    },
                    error: function(err) {
                        app.alerts.error(err);
                        form.find(".ui-submit").removeClass("ui-btn-active");
                    }
                });

                return false;
            },

            handleTransactionAddSuccess: function(data, form) {
                var trans = data.transaction,
                    acct = data.account;
                
                if (!trans || !acct) {
                    console.warn("Bad data returned from transaction/add: ", data);
                    app.alerts.error("There may have been a problem adding this transaction. Please check your account.");
                    return;
                }

                console.log("Transactiona added: ", data);

                var transDiv = $("<div data-role='collapsible' class='ui-first-child' />");
                
                app.main.$acctBalance.text("$" + acct.balance.toFixed(2));
                if (acct.balance > 0) {
                    app.main.$acctBalance.addClass("positive");
                    app.main.$acctBalance.removeClass("negative");
                } else {
                    app.main.$acctBalance.addClass("negative");
                    app.main.$acctBalance.removeClass("positive");
                }

                app.main.$recentTrans.find(".ui-first-child").removeClass("ui-first-child");

                transDiv.append(
                    "<h3>$" + trans.amount.toFixed(2) + " " + trans.dateDisplay + "</h3>" +
                    "<p class='description'>" + trans.description + "</p>" +
                    "<p class='category'>" + app.categories[trans.category] + "</p>"
                );
                app.main.$recentTrans.prepend(transDiv);
                transDiv.collapsible();

                app.alerts.success("Transaction added successfully!");
                form.find("[name=description]").val("");
                form.find("[name=amount]").val("").focus();
                form.find(".ui-submit").removeClass("ui-btn-active");
            },

            handleDeleteTransaction: function(e) {
                var $transNode = $(e.target).closest(".transactionDetail"),
                    id = $transNode.data("transid");
                
                e.preventDefault();

                $.mobile.changePage( "#confirmDelete", { role: "dialog" } );

                app.main.$confirmDelete.one("click", "a", function() {
                    app.main.$confirmDelete.dialog("close");

                    if ($(this).hasClass("doDelete")) {
                        app.main.confirmDeleteTransaction(id, $transNode);
                    }
                });
            },

            confirmDeleteTransaction: function(id, $transNode) {
                app.trans.remove(id, {
                    success: function(result) {
                        app.main.handleTransactionDeleteSuccess(result, $transNode);
                    },
                    error: function(err) {
                        app.alerts.error(err);
                    }
                });
            },

            handleTransactionDeleteSuccess: function(data, $node) {
                var acct = data.account;

                if (!acct) {
                    console.warn("Bad data returned from transaction/delete: ", data);
                    app.alerts.error("There may have been a problem deleting this transaction. Please check your account.");
                    return;
                }

                console.log("Transactiona deleted: ", data);

                app.main.$acctBalance.text("$" + acct.balance.toFixed(2));
                if (acct.balance > 0) {
                    app.main.$acctBalance.addClass("positive");
                    app.main.$acctBalance.removeClass("negative");
                } else {
                    app.main.$acctBalance.addClass("negative");
                    app.main.$acctBalance.removeClass("positive");
                }

                $node.remove();
                app.alerts.success("Transaction deleted successfully!");
            },

            handleReportFilter: function(e) {
                var start = new Date(app.main.$reportDateStart.val()),
                    end = new Date(app.main.$reportDateEnd.val()),
                    category = Number(app.main.$reportCategory.val());

                e.preventDefault();

                category = (category || null);
                if (!start) {
                    app.alerts.error("Please select a valid start date for filtering");
                    return;
                }
                if (!end) {
                    app.alerts.error("Please select a valid end date for filtering");
                    return;
                }

                // app.main.$reportChart.html("<p class='loading'><img src='/style/images/ajax-loader.gif' alt='Loading' /></p>");
                
                app.main.getAccountReport({
                    category: category,
                    dateStart: app.main.$reportDateStart.val(),
                    dateEnd: app.main.$reportDateEnd.val() + " 23:59:59"
                });

                $(this).find(".ui-submit").removeClass("ui-btn-active");
                
                return false;
            },

            getAccountReport: function(options) {
                options = (options || {});

                options.category = (options.category || null);
                options.dateStart = (options.dateStart || null);
                options.dateEnd = (options.dateEnd || null);

                $.ajax({
                    url: "/account/report",
                    type: "get",
                    data: options,
                    dataType: "json",
                    success: app.ajaxSuccess(app.main.handleReportResults, app.main.handleReportError),
                    error: app.ajaxError(app.main.handleReportError)
                });
            },

            handleReportResults: function(data) {
                app.main.$totals
                    .find(".deposits")
                        .text("$" + data.totals.deposits)
                        .end()
                    .find(".expenses")
                        .text("$" + data.totals.expenses);

                if (data.type === "pie") {
                    
                    app.main.$reportTrans.hide();
                    app.main.$reportChart.show();

                    $.plot(app.main.$reportChart, data.categories.slice(1), app.main.pieOptions);
                }
            },

            handleReportError: function(err) {
                app.alerts.clearAll();
                app.alerts.error(err);
            },

            pieLabelFormatter: function(label, series) {
                return "<div class='pieLabel'>" + label + "<br/>$" + Math.round(series.data[0][1]) + "</div>";
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
            },

            remove: function(id, cb) {
                console.log("deleting transaction: ", id);

                cb = (cb || {});

                if (!id || !id.length) {
                    app.alerts.error("Please select a transaction to delete");
                    return;
                }

                $.ajax({
                    url: "/transaction/" + id,
                    type: "delete",
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