'use strict';

var gulp = require('gulp');

var options = {
  coverageSettings: {
    thresholds: {
      statements: 100,
      branches: 100,
      lines: 100,
      functions: 100
    },
  },
  paths: {
    lint: ['index.js', 'test/*.js'],
    cover: 'index.js',
    test: ['test/*.js']
  },
  complexity: {
    trycatch: true,
    halstead: [10, 13, 20],
    maintainability: 90
  },
  nicePackage: {
    options: {
      warnings: true,
      recommendations: true
    }
  }
};

require('load-common-gulp-tasks')(gulp, options);

