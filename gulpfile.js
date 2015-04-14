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

  gulp.watch( 'style.less', ['compile'] );

  $.livereload.listen();
  gulp.watch( [ 'script.js', 'style.css', 'newtab.html' ], function(){
    console.log('\n=============\nPAGE RELOADED\n==============');
  })
  .on('change', $.livereload.changed);

})