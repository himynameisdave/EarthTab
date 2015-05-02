var gulp = require('gulp'),
    $    = require('gulp-load-plugins')({
              scope: ['devDependencies'],
              replaceString: 'gulp-',
            });


gulp.task( 'compile-css', function(){

  return gulp.src('./src/css/style.less')
          .pipe($.less())
          .pipe($.autoprefixer())
//          .pipe($.minifyCss())
          .pipe(gulp.dest('./app/css/'));

});

gulp.task( 'compile-js', function(){

  return gulp.src('./src/js/script.js')
//          .pipe($.uglify())
          .pipe(gulp.dest('./app/js/'))

});


gulp.task( 'default', function(){

  gulp.watch( './src/css/*.less' , ['compile-css'] );
  gulp.watch( './src/js/script.js' , ['compile-js'] );

})
