module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        jshint: {
            files: [ "source/modules/**/*.js", "source/public/script/*.js" ],
            options: {
                force: true,
                jshintrc: "./.jshintrc"
            }
        }

    });

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.registerTask( "default", [ "jshint" ] );

};
