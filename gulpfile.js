var gulp = require('gulp'),
    $    = require('gulp-load-plugins')({
              scope: ['devDependencies'],
              replaceString: 'gulp-',
            });


/**     BUILD IT UP!    **/

gulp.task( 'build', ['build:compile-css', 'build:compile-js', 'build:move-html', 'build:move-fonts', 'build:move-images', 'build:zip'] )

gulp.task( 'build:compile-css', function(){

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

gulp.task( 'build:compile-js', function(){

  return gulp.src('./src/js/script.js')
          .pipe($.uglify())
          .pipe(gulp.dest('./build/js/'))

});

gulp.task( 'build:move-html', function(){

  return gulp.src([ './src/newtab.html', './src/manifest.json' ])
          .pipe(gulp.dest('./build/'));

});

gulp.task( 'build:move-fonts', function(){

  return gulp.src('./src/fonts/**/*')
      .pipe(gulp.dest('./build/fonts/'));

});

gulp.task( 'build:move-images', function(){

  return gulp.src('./src/images/**/*')
    .pipe($.imagemin())
    .pipe(gulp.dest('./build/images/'));

});

gulp.task( 'build:zip', ['build:compile-css', 'build:compile-js', 'build:move-html', 'build:move-fonts', 'build:move-images'], function(){

  return gulp.src('./build/**/*')
        .pipe($.zip('EarthTab.zip'))
        .pipe(gulp.dest('./'));

});


/**     DEV IT UP!    **/

gulp.task( 'default', function(){

  gulp.watch( './src/css/*.less' , ['dev:compile-css'] );

})

gulp.task( 'dev:compile-css', function(){

  return gulp.src('./src/css/style.less')
          .pipe($.less())
          .pipe(gulp.dest('./src/css/'));

});
