'use strict';

let gulp = require('gulp');
let eslint = require('gulp-eslint');
let gulpIf = require('gulp-if');
let jasmine = require('gulp-jasmine');

let config = {
    eslint: [ '**/*.js', '!node_modules/**' ],
    tests: [ '**/*-spec.js' ]
};

function isFixed(file) {
    return file.eslint && typeof file.eslint.output === 'string';
}

gulp.task('lint', function () {
    return gulp.src(config.eslint)
        .pipe(eslint())
        .pipe(eslint.format());
});

gulp.task('lint-fix', function () {
    return gulp.src(config.eslint)
        .pipe(eslint({ fix: true }))
        .pipe(eslint.format())
        .pipe(gulpIf(isFixed, gulp.dest('./')));
});

gulp.task('test', function () {
    return gulp.src(config.tests)
        .pipe(jasmine());
});
