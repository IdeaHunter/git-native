'use strict';

let gulp = require('gulp');
let eslint = require('gulp-eslint');
let gulpIf = require('gulp-if');

let config = {
    eslint: [ '**/*.js', '!node_modules/**' ]
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
