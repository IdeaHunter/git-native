'use strict';

let gulp = require('gulp');
let eslint = require('gulp-eslint');
let gulpIf = require('gulp-if');
let jasmine = require('gulp-jasmine');
let spawn = require('child_process').spawn;
let notifier = require('node-notifier');
let cpplint = require('node-cpplint/lib/index.js');
let cpplintReporters = require('node-cpplint/lib/reporters').spec;

let config = {
    eslint: [ '**/*.js', '!node_modules/**' ],
    cpplint: [ 'src/*.cc', 'src/*.h' ],
    tests: [ '**/*-spec.js' ]
};

function isFixed(file) {
    return file.eslint && typeof file.eslint.output === 'string';
}


gulp.task('rebuild', function (cb) {
    let child = spawn('node-gyp', [ 'build', '--debug' ], { stdio: 'inherit' });

    child.on('close', function () {
        notifier.notify({
            title: 'Build done'
        });
        cb();
    });
});

gulp.task('spawn-tests', function (cb) {
    let child = spawn('gulp', [ 'test' ], { stdio: 'inherit' });
    child.on('close', function () {
        notifier.notify({
            title: 'Build done'
        });
        cb();
    });
});

gulp.task('cpplint', function () {
    let options = {
        files: config.cpplint,
        filters: {
            legal: {
                copyright: false
            },
            readability: {
                casting: false
            }
        }
    };
    cpplint(options, cpplintReporters);
});

gulp.task('eslint', function () {
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
        .pipe(jasmine({ verbose: false }));
});

gulp.task('rebuild+tests', [ 'rebuild' ], function () {
    return gulp.start('test');
});

gulp.task('lint', [ 'eslint', 'cpplint' ]);

gulp.task('develop', [ 'rebuild+tests' ], function () {
    gulp.watch([ 'build/*/git.node', config.tests ], [ 'spawn-tests' ]);
    gulp.watch([ 'binding.gyp', 'src/**/*.+(cc|h)' ], [ 'rebuild' ]);
});
