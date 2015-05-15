var gulp = require('gulp'),
    $    = require('gulp-load-plugins')({
              scope: ['devDependencies'],
              replaceString: 'gulp-',
            });


/**
  *       Build/production
  *
  */
gulp.task( 'build', ['build-compile-css', 'build-compile-js', 'move-html'] )


gulp.task( 'build-compile-css', function(){

  return gulp.src('./src/css/style.less')
          .pipe($.less())
          .pipe($.autoprefixer({
            browsers: ['Chrome > 20'],
            cascade: false
          }))
          .pipe($.csscomb())
          .pipe($.minifyCss())
          .pipe(gulp.dest('./build/css/'));

});

gulp.task( 'build-compile-js', function(){

  return gulp.src('./src/js/script.js')
          .pipe($.uglify())
          .pipe(gulp.dest('./build/js/'))

});

gulp.task( 'move-html', function(){

  return gulp.src( './app/newtab.html' )
          .pipe(gulp.dest('./build/'));

});





/**
  *       Dev/default
  *
  */
gulp.task( 'default', function(){

  gulp.watch( './src/css/*.less' , ['dev-compile-css'] );
  gulp.watch( './src/js/script.js' , ['dev-compile-js'] );

})

gulp.task( 'dev-compile-css', function(){

  return gulp.src('./src/css/style.less')
          .pipe($.less())
          .pipe(gulp.dest('./app/css/'));

});

gulp.task( 'dev-compile-js', function(){

  return gulp.src('./src/js/script.js')
  //        .pipe($.uglify())
          .pipe(gulp.dest('./app/js/'))

});


