const gulp = require('gulp');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const concat = require('gulp-concat');
const del = require('del');
const jshint = require('gulp-jshint');
const stylish = require('jshint-stylish');

let transpiler = 'Babel';
const SRC = 'src/*.js';
const DIST = 'dist';

// log error and stop current operation.
// but the whole operation does not cease.
let onError = function (err) {
  console.error(err);
  this.emit('end');
};

gulp.task('default', () => {
  console.log(`You're using Gulp with ${transpiler}.`);
});

gulp.task('clean', () => del(DIST  + '/*'));

gulp.task('lint', () => {
  return gulp.src(SRC)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish))
    .pipe(jshint.reporter('fail'))
});

gulp.task('babel', ['clean'], () => {
  return gulp.src(SRC)
    .pipe(babel())
    .on('error', onError)
    .pipe(uglify())
    .pipe(gulp.dest(DIST));
});

gulp.task('monit', () => {
  gulp.watch(SRC, ['babel']);
});