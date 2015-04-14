var gulp = require('gulp'),
    $    = require('gulp-load-plugins')({
              scope: ['devDependencies'],
              replaceString: 'gulp-',
            });


gulp.task( 'default', [ 'compile', 'reload' ]);


gulp.task( 'compile', function(){

  return gulp.src('style.less')
          .pipe($.less())
          .pipe($.autoprefixer())
          .pipe($.minifyCss())
          .pipe(gulp.dest('./'));

});


gulp.task( 'reload', function(){

  return gulp.watch( 'style.less', ['compile'] );

})