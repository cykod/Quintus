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
    docco: {
      app: {
        src: ['lib/quintus*.js','examples/*/*.js','examples/*/javascripts/*.js']
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
    },
    shell: {
      gzip: {
        command: [
          "gzip dist/quintus-all.js",
          "mv dist/quintus-all.js.gz dist/quintus-all.js",
          "gzip dist/quintus-all.min.js",
          "mv dist/quintus-all.min.js.gz dist/quintus-all.min.js"
          ].join("&&")
      }
    }
  });

  // Default task.
  grunt.registerTask('default', ['jshint','jasmine','concat:dist','uglify:dist']);
  grunt.registerTask('release', ['jshint','jasmine','concat:dist','uglify:dist','shell:gzip','s3-copy']);
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jasmine');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-docco');

  grunt.registerTask('s3-copy',function() { 
    var AWS = require("aws-sdk"),
        fs = require('fs'),
        pjson = require('./package.json'),
        s3Config = require("./s3.json"),
        done = this.async();

    AWS.config.loadFromPath("./s3.json");
    var s3 = new AWS.S3();

    var filePath = "v" + pjson.version + "/";

    var allData = fs.readFileSync("dist/quintus-all.js");
    var minData = fs.readFileSync('dist/quintus-all.min.js');

    function s3Opts(key,data) {
      return  {
        Bucket: s3Config.bucket,
        Key: filePath + key,
        Body: data,
        ACL: "public-read",
        ContentEncoding: "gzip",
        ContentType: "application/x-javascript"
      }

    }

    s3.client.putObject(s3Opts('quintus-all.js',allData),
      function() {
        s3.client.putObject(s3Opts('quintus-all.min.js',minData), done) });
  });
     

};
