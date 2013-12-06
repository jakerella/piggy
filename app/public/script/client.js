
(function() {

    window.console = (window.console || { log: function() {}, error: function() {}});

    var app = window.pig = {
        cookieName: "piggy_token",

        init: function(page, options) {
            options = (options || {});

            console.log("Starting piggy client on", page, options);

            if (app[page] && app[page].init && app[page].init.apply) {
                app[page].init.apply(app[page], [options]);
            }

        },

        add: {
            init: function(options) {
                var form = document.querySelector("[action=\\/transaction\\/add]");

                form.addEventListener("submit", this.handleAddTransaction);

            },

            handleAddTransaction: function(e) {
                console.log("adding transaction", e);

                e.preventDefault();
                return false;
            }
        }

    };
    

})();