/*global module:false*/
module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jasmine: {
      all: {
        src: 'lib/*.js',
        options: {
          specs: 'specs/spec/*.js',
          helpers: ['specs/lib/imagediff.js', 'specs/fixtures/*.js']
        },
        errorReporting: true
      }
    },
    concat: {
      dist: {
        src: ["lib/quintus.js","lib/*.js"],
        dest: 'dist/quintus-all.js'
      }
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
          ' *  <%= pkg.homepage %>\n' +
          ' *  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
          ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
      },
      dist: {
        files: {
          'dist/quintus-all.min.js': ['dist/quintus-all.js']
        }
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'lint qunit'
    },
    exec: {
      api_styles: {
        cmd: "./node_modules/stylus/bin/stylus < ./extra/doc/api-styles.styl > ./docs/api-styles.css"
      },

      api_docs: {
        cmd: "./node_modules/jade/bin/jade ./extra/doc/index.jade -O ./docs"
      },

      // Until grunt docco works again...
      docco: {
        cmd: "./node_modules/docco/bin/docco -o ./docs lib/quintus*.js examples/*/*.js examples/*/javascripts/*.js"
      }
    },

    jshint: {
      options: {
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: true,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        browser: true
      },
      globals: {}
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint','jasmine','concat:dist','uglify:dist']);
  grunt.registerTask("docs", [  'exec:api_styles', 'exec:api_docs', 'exec:docco' ]);
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-exec');

};
