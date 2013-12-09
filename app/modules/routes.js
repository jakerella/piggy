
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

            // TODO: redirect to login
            // res.redirect("/account/login");

            currAccount = new Account("52a50993e4b0a4119d8dbc39", function(err, acct) {
                if (err) { next(err); return; }
                req.session.account = acct._id;
                next();
            });
        }
    },

    // ----------------- GET Requests --------------- //

    index: function(req, res) {
        res.render("index", { title: "Home", page: "home" });
    },

    showLoginPage: function(req, res) {
        res.render("login", { title: "Login", page: "login" });
    },

    showAddPage: function(req, res, next) {
        if (!currAccount) {
            next(new e.AuthError("Sorry, but you'll need to log in before adding a transaction"));
            return;
        }

        res.render("add", {
            title: "Add Transaction",
            page: "add-trans",
            account: currAccount,
            today: (new Date()).toFormat("M/D/YYYY"),
            categories: Categories
        });
    },


    // ----------------- POST Requests --------------- //

    addTransaction: function(req, res, next) {
        console.log(req.body);

        if (!currAccount) {
            next(new e.AuthError("Sorry, but you'll need to log in before adding a transaction"));
            return;
        }

        currAccount.addTransaction(req.body, function transAdded(err, trans) {
            if (err) {
                next(err);
                return;
            }

            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(trans));
        });
    }


};

module.exports = self;


// exports.getProjects = function(req, res, next) {
//     console.log("getting projects for user token: ", req.body.token);
//     if (!req.body.token || !req.body.token.length) {
//         next(new e.BadRequestError("Please provide a valid Pivotal Tracker API token", 403));
//         return;
//     }

//     // reset these values on new request
//     req.session.token = req.body.token;
//     req.session.projects = [];

//     pivotal.useToken(req.body.token);

//     data.getUserProjects(req, function(err, projects) {
//         if (err) {
//             if (err.code) {
//                 next(new e.BadRequestError(
//                     ((err.code === 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
//                     err.code
//                 ));
//             } else {
//                 next(new Error(err.toString(), 500));
//             }
//             return;
//         }

//         req.session.projects = projects;

//         res.writeHead(200, {"Content-Type": "application/json"});
//         res.end(JSON.stringify({
//             token: req.session.token,
//             projects: projects
//         }));
//         return;
//     });
// };

// exports.listProjects = function(req, res, next) {
//     if (req.session.projects) {

//         renderProjectsPage(res, next, req.session.projects);
//         return;

//     } else {
//         // We don't have projects, so go get them
//         // NOTE: the token must be present already (and in pivotal module)
//         //       based on the "hasToken()" middleware used in the routing in app.js

//         data.getUserProjects(req, function(err, projects) {
//             if (err) {
//                 if (err.code) {
//                     next(new e.BadRequestError(
//                         ((err.code === 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
//                         err.code
//                     ));
//                 } else {
//                     next(new Error(err.toString(), 500));
//                 }
//                 return;
//             }

//             req.session.projects = projects;
//             renderProjectsPage(res, next, projects);
//             return;
//         });
//     }
// };

// exports.viewProject = function(req, res, next) {
//     var i, project = null;

//     if (req.session.projects) {

//         if (req.session.projects) {
//             for (i in req.session.projects) {
//                 if (req.session.projects[i].id === req.params.id) {
//                     project = req.session.projects[i];
//                 }
//             }
//         }

//         renderProjectPage(res, next, project);
//         return;

//     } else {
//         // NOTE: the token must be present already (and in pivotal module)
//         //       based on the "hasToken()" middleware used in the routing in app.js

//         data.getUserProjects(req, function(err, projects) {
//             if (err) {
//                 if (err.code) {
//                     next(new e.BadRequestError(
//                         ((err.code === 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
//                         err.code
//                     ));
//                 } else {
//                     next(new Error(err.toString(), 500));
//                 }
//                 return;
//             }

//             req.session.projects = projects;

//             for (var i in req.session.projects) {
//                 if (req.session.projects[i].id === req.params.id) {
//                     project = req.session.projects[i];
//                 }
//             }

//             renderProjectPage(res, next, project);
//             return;
//         });
//     }
// };

// exports.updateStats = function(req, res, next) {
//     var i, project;

//     if (req.session.projects) {
//         if (req.session.projects) {
//             for (i in req.session.projects) {
//                 if (req.session.projects[i].id === req.params.id) {
//                     project = req.session.projects[i];
//                 }
//             }
//         }

//         doStatsUpdate(res, next, project, req.body.stats);
//         return;

//     } else {
//         // NOTE: the token must be present already (and in pivotal module)
//         //       based on the "hasToken()" middleware used in the routing in app.js

//         data.getUserProjects(req, function(err, projects) {
//             if (err) {
//                 if (err.code) {
//                     next(new e.BadRequestError(
//                         ((err.code === 401)?"Sorry, but that is not a valid Pivotal Tracker API token!":err.desc),
//                         err.code
//                     ));
//                 } else {
//                     next(new Error(err.toString(), 500));
//                 }
//                 return;
//             }

//             req.session.projects = projects;

//             for (var i in req.session.projects) {
//                 if (req.session.projects[i].id === req.params.id) {
//                     project = req.session.projects[i];
//                 }
//             }

//             doStatsUpdate(res, next, project, req.body.stats);
//             return;
//         });
//     }
// };


// ------------- Private helpers ------------- //

// renderProjectsPage = function(res, next, projects) {
//     res.render("projects", {
//         title: appName,
//         page: "projects",
//         projects: projects
//     });
// };

// renderProjectPage = function(res, next, project) {
//     if (!project || !project.id) {
//         next(new e.BadRequestError("Sorry, but either that project does not exist in this system, or you do not have access to it!", 404));
//         return;
//     }

//     data.getStatsForProject(project.id, function(err, stats) {

//         if (err) {
//             next(new Error(err.toString(), 500));
//             return;
//         }

//         res.render("project", {
//             //title: appName + " - "+project.name,
//             title: appName,
//             page: "project",
//             project: project,
//             stats: JSON.stringify(stats)
//         });
//     });
// };

// renderProjectEditPage = function(res, next, project) {
//     if (!project || !project.id) {
//         next(new e.BadRequestError("Sorry, but either that project does not exist in this system, or you do not have access to it!", 404));
//         return;
//     }

//     authenticateOwner(project, function(err) {
//         if (err) { next(err); return; }

//         res.render("edit", {
//             title: appName + " - Edit "+project.name,
//             page: "edit-project",
//             project: project
//         });
//     });
// };

// doStatsUpdate = function(res, next, project, statsUpdate) {
//     if (!project || !project.id) {
//         next(new e.BadRequestError("Sorry, but either that project does not exist in this system, or you do not have access to it!", 404));
//         return;
//     }

//     if (!statsUpdate || !statsUpdate.date || !statsUpdate.project) {
//         next(new e.BadRequestError("Sorry, but that is not a valid stats update object!", 400));
//         return;
//     }

//     statsUpdate.project = Number(statsUpdate.project);
//     if (!statsUpdate.project || Number(statsUpdate.project) !== Number(project.id)) {
//         next(new e.BadRequestError("Sorry, but your stats update ID does not match your update URL!", 400));
//         return;
//     }

//     if (!/^20[0-9]{2}\-(0[1-9]|1[0-2])\-(0[1-9]|[12][0-9]|3[01])$/.test(statsUpdate.date)) {
//         next(new e.BadRequestError("Sorry, but that is not a valid stats date!", 400));
//         return;
//     }

//     console.log("Stats document being saved by "+pivotal.token, statsUpdate);

//     authenticateOwner(project, function(err) {
//         if (err) { next(err); return; }

//         mongo.getOrCreateStats(
//             project.id,
//             statsUpdate.date,
//             res,
//             function(err, stats) {
//                 if (err) { next(err); return; }

//                 // merge in the stats updates
//                 for (var k in statsUpdate) {
//                     if (k !== "project" &&
//                         k !== "date" &&
//                         statsUpdate.hasOwnProperty(k)) {
//                         stats[k] = Number(statsUpdate[k]);
//                     }
//                 }

//                 // Do the DB update
//                 mongo.connect(res, function(err, db) {
//                     if (err) { next(err); return; }

//                     mongo.getOrCreateCollection(db, "stats", function(err, coll) {
//                         if (err) { next(err); return; }

//                         // update the statistics for this date in our DB
//                         coll.update({_id: stats._id}, stats, {safe: true}, function(err) {
//                             if (err) { next(err); return; }

//                             console.log("Stats document update", stats);

//                             res.writeHead(200, {"Content-Type": "application/json"});
//                             res.end(JSON.stringify({ project: project, stats: stats }));
//                         });
//                     });
//                 });
//             }
//         );
//     });
// };

// authenticateOwner = function(project, cb) {
//     if (!project || !project.id) {
//         cb(new e.AuthError("Please provide a project to owner authentication for."));
//         return;
//     }

//     data.getCurrentUserInfo(function(err, data) {
//         var i, l;

//         if (err) {
//             console.error("Error getting user data (" + err.code + "): ", err.message);
//             cb(new e.AuthError("Unable to authenticate user as an owner."), 500);
//             return;

//         } else {
//             for (i=0, l = data.projects.length; i<l; ++i) {
//                 if (Number(data.projects[i].project_id) === Number(project.id) &&
//                     data.projects[i].role === "owner") {

//                     cb(null);
//                     return;
//                 }
//             }

//             cb(new e.AuthError("User is not an owner."), 401);
//             return;
//         }
//     });

// };
