module.exports = function(grunt) {

    require('load-grunt-tasks')(grunt);

    grunt.initConfig({

        jasmine_node: {
            options: {

            },
            all: ['test/']
        },

        watch: {
            js: {
                files: ['src/**/*', 'test/**/*.js'],
                tasks: 'test'
            }
        }

    });

    grunt.registerTask('default', ['test']);
    grunt.registerTask('test', ['jasmine_node']);

};