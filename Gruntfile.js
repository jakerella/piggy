module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            files: [ "app/app.js", "app/modules/**/*.js", "app/public/script/*.js" ],
            options: {
                force: true,
                jshintrc: "./.jshintrc"
            }
        }

    });

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.registerTask( "default", [ "jshint" ] );

};
