
var updateStoryAndStats,
    e = require("./errors.js"),
    mongo = require("./mongo-helper.js");

// exports.getStatsForProject = function(project, options, cb) {
//     if (options.isFunction()) { cb = options; options = null; }
//     options = (options || {});
//     options.scope = (options.scope || {});
//     project = Number(project);

//     if (!project) {
//         cb("Please provide a valid project ID to get statistics");
//         return;
//     }

//     mongo.connect(options.scope, function(err, db) {
//         if (err) { cb( e.getErrorObject(err) ); return; }

//         mongo.getOrCreateCollection(db, "stats", function(err, coll) {
//             if (err) { cb( e.getErrorObject(err) ); return; }

//             coll
//             .find({ "project": project })
//             .sort({ "date": 1 })
//             .toArray(function(err, stats) {
//                 if (err) { cb( e.getErrorObject(err) ); return; }

//                 cb(null, stats);
//                 return;
//             });
//         });
//     });
// };


// exports.processStoryUpdate = function(activity, storyUpdate, scope, cb) {
//     if (scope.isFunction()) { cb = scope; scope = null; }
//     cb = (cb && cb.isFunction()) ? cb : function() {};
//     scope = (scope || {});

//     verifyPTActivity(activity, function(err) {
//         if (err) { cb( e.getErrorObject(err) ); return; }

//         var activityTime = new Date(activity.occurred_at);

//         console.log("Validity of activity verified!");
        
//         // for deleted stories we need to get it's current state and decrement
//         if (activity.event_type === "story_delete") {
//             console.log("Processing story deletion...");
//             updateStoryAndStats(
//                 {
//                     "project_id": activity.project_id,
//                     "id": storyUpdate.id
//                 }, 
//                 "deleted", 
//                 activityTime, 
//                 scope,
//                 cb
//             );
//             return;
//         }

//         // was this a status change?
//         if (activity.event_type === "story_update" && storyUpdate.current_state) {
//             console.log("Processing story status update...");
//             pivotal.getStory(activity.project_id, storyUpdate.id, function (err, story) {
//                 if (err) {
//                     if (err.code === 404) {
//                         cb( new e.HttpError("The PT API returned a 404, was this story deleted?", 404) );
//                     } else {
//                         cb( e.getErrorObject(err) );
//                     }
//                     return;
//                 }

//                 updateStoryAndStats(
//                     story, 
//                     storyUpdate.current_state, 
//                     activityTime, 
//                     scope,
//                     cb
//                 );
//             });
//             return;
//         }

//         console.log("This was not a supported update, nothing to do.");
//         cb(null, {
//             "action": "noop",
//             "story": storyUpdate.id
//         });
//         return;
//     });
// };



// ------------- Private Helpers ------------ //

// updateStoryAndStats = function(story, state, activityTime, scope, cb) {
//     cb = (cb && cb.isFunction()) ? cb : function() {};

//     mongo.getOrCreateStory(
//         {
//             project_id: story.project_id,
//             id: story.id,
//             current_state: state
//         },
//         scope,
//         function(err, local) {
//             if (err) { cb( e.getErrorObject(err) ); return; }

//             var prevStatus = local.current_state,
//                 m = activityTime.getMonth() + 1,
//                 d = activityTime.getDate(),
//                 actCymd = activityTime.getFullYear()+"-"+((m > 9)?m:"0"+m)+"-"+((d > 9)?d:"0"+d);
            
//             mongo.getOrCreateStats(
//                 story.project_id, 
//                 actCymd, 
//                 scope,
//                 function(err, stats) {
//                     if (err) { cb( e.getErrorObject(err) ); return; }

//                     // update the stats and story documents
                    
//                     if (prevStatus !== state && stats[prevStatus]) {
//                         // only update previous state count if we're tracking it
//                         // and no negatives!
//                         stats[prevStatus] = Math.max(0, stats[prevStatus] - 1);
//                     }
//                     // increment the new state, again only if we're tracking it
//                     if (typeof stats[state] !== "undefined") {
//                         stats[state]++;
//                     }
//                     // set the new state in our local DB object
//                     local.current_state = state;
                    
//                     // Do the DB updates
//                     mongo.connect(scope, function(err, db) {
//                         if (err) { cb( e.getErrorObject(err) ); return; }

//                         mongo.getOrCreateCollection(db, "stats", function(err, coll) {
//                             if (err) { cb(err, null); return; }

//                             // update the statistics for this date in our DB
//                             coll.update({_id: stats._id}, stats, {safe: true}, function(err) {
//                                 if (err) { cb(err, null); return; }
//                                 console.log("Stats document saved");

//                                 mongo.getOrCreateCollection(db, "story", function(err, coll) {
//                                     if (err) {
//                                         console.error("The stats document was updated but there was an error updating the story!", local, actCymd);
//                                         cb(err, null);
//                                         return;
//                                     }

//                                     // update the story status in our DB
//                                     coll.update({_id: local._id}, local, {safe: true}, function(err) {
//                                         if (err) { cb(err, null); return; }

//                                         console.log("Story document saved");
//                                         cb(null, {
//                                             stats: stats,
//                                             story: story,
//                                             localStory: local
//                                         });
//                                     });
//                                 });
//                             });
//                         });

//                     });
//                 }
//             );
//         }
//     );
// };