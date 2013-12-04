module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON("package.json"),

        clean: [ "app" ],

        copy: {
            serverjs: {
                expand: true,
                src: [ "modules/**/*.js", "app.js" ],
                cwd: "source/",
                dest: "app/"
            },
            views: {
                expand: true,
                src: [ "views/**/*.jade" ],
                cwd: "source/",
                dest: "app/"
            },
            scripts: {
                expand: true,
                src: [ "public/script/*.js" ],
                cwd: "source/",
                dest: "app/"
            }
        },

        watch: {
            clientjs: {
                files: [ "source/public/script/**/*.js" ],
                tasks: [ "copy:scripts" ],
                options: { nospawn: true }
            },
            serverjs: {
                files: [ "source/app.js", "source/modules/**/*.js" ],
                tasks: [ "copy:serverjs" ],
                options: { nospawn: true }
            },
            styles: {
                files: [ "source/public/style/**/*.css" ],
                tasks: [ "copy:styles" ],
                options: { nospawn: true }
            },
            views: {
                files: [ "source/views/**/*.jade" ],
                tasks: [ "copy:views" ],
                options: { nospawn: true }
            }
        },

        jshint: {
            files: [ "source/modules/**/*.js", "source/public/script/*.js" ],
            options: {
                force: true,
                jshintrc: "./.jshintrc"
            }
        }

    });

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.registerTask( "dev", [ "clean", "jshint", "copy" ] );
    grunt.registerTask( "deploy", [ "clean", "copy" ] );
    grunt.registerTask( "heroku:production", "deploy" );
    grunt.registerTask( "heroku:development", "deploy" );

    grunt.registerTask( "default", [ "dev" ] );

};
