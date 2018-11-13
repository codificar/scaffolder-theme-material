'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var jsonminify = require('gulp-jsonminify');
var stripDebug = require('gulp-strip-debug');

var $ = require('gulp-load-plugins')({
	pattern: ['gulp-*', 'main-bower-files', 'uglify-save-license', 'del']
});

gulp.task('partials', function ()
{
	return gulp.src([
			path.join(conf.paths.src, '/app/**/*.html'),
			path.join(conf.paths.tmp, '/serve/app/**/*.html')
		])
		.pipe($.minifyHtml({
			empty : true,
			spare : true,
			quotes: true
		}))
		.pipe($.angularTemplatecache('templateCacheHtml.js', {
			module: 'scaffolder',
			root  : 'app'
		}))
		.pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('partialsResource', function ()
{
	return gulp.src([
			path.join(conf.paths.rsc, '/**/*.html')
		])
		.pipe($.minifyHtml({
			empty : true,
			spare : true,
			quotes: true
		}))
		.pipe($.angularTemplatecache('templateResourceCacheHtml.js', {
			module: 'scaffolder',
			root  : 'resources/angularjs'
		}))
		.pipe(gulp.dest(conf.paths.tmp + '/partials/'));
});

gulp.task('html', ['inject', 'partials', 'partialsResource'], function ()
{
	var partialsInjectFile = gulp.src([ path.join(conf.paths.tmp, '/partials/*.js') ], {read: false});
	var partialsInjectOptions = {
		starttag    : '<!-- inject:partials -->',
		ignorePath  : path.join(conf.paths.tmp, '/partials'),
		addRootSlash: false
	};

	var htmlFilter = $.filter('*.html', {restore: true});
	var jsFilter = $.filter('**/*.js', {restore: true});
	var cssFilter = $.filter('**/*.css', {restore: true});
	var assets;

	console.log(conf.paths.tmp);
	console.log(conf.paths.dist);

	return gulp.src(path.join(conf.paths.tmp, '/serve/*.html'))
		.pipe($.inject(partialsInjectFile, partialsInjectOptions))
		.pipe(assets = $.useref.assets())
		.pipe($.rev())
		.pipe(jsFilter)
		.pipe($.sourcemaps.init())
		.pipe($.ngAnnotate())
		.pipe($.uglify({preserveComments: $.uglifySaveLicense})).on('error', conf.errorHandler('Uglify'))
		.pipe($.sourcemaps.write('maps'))
		.pipe(jsFilter.restore)
		.pipe(cssFilter)
		.pipe($.sourcemaps.init())
		.pipe($.minifyCss({processImport: false}))
		.pipe($.sourcemaps.write('maps'))
		.pipe(cssFilter.restore)
		.pipe(assets.restore())
		.pipe($.useref())
		.pipe($.revReplace())
		.pipe(htmlFilter)
		.pipe($.minifyHtml({
			empty       : true,
			spare       : true,
			quotes      : true,
			conditionals: true
		}))
		.pipe(htmlFilter.restore)
		.pipe(gulp.dest(path.join(conf.paths.dist, '/')))
		.pipe($.size({
			title    : path.join(conf.paths.dist, '/'),
			showFiles: true
		}));
});

// Only applies for fonts from bower dependencies
// Custom fonts are handled by the "other" task
gulp.task('fonts', function ()
{
	return gulp.src($.mainBowerFiles())
		.pipe($.filter('**/*.{eot,svg,ttf,woff,woff2}'))
		.pipe($.flatten())
		.pipe(gulp.dest(path.join(conf.paths.dist, '/fonts/')));
});

gulp.task('other', function ()
{
	var fileFilter = $.filter(function (file)
	{
		return file.stat.isFile();
	});

	return gulp.src([
			path.join(conf.paths.src, '/**/*'),
			path.join('!' + conf.paths.src, '/**/*.{html,css,js,scss}')
		])
		.pipe(fileFilter)
		.pipe(gulp.dest(path.join(conf.paths.dist, '/')));
});

gulp.task('assets', function ()
{
	return gulp.src([
			path.join(conf.paths.rsc, '../assets/**/*'),
		])
		.pipe(gulp.dest(path.join(conf.paths.dist, '/assets')));
});

gulp.task('i18n', function ()
{
	var fileFilter = $.filter(function (file)
	{
		return file.stat.isFile();
	});

	return gulp.src([
			path.join(conf.paths.rsc, '/**/*.json')
		])
		.pipe(jsonminify())
		.pipe(gulp.dest(path.join(conf.paths.dist, '/app')));
});

gulp.task('replaceStyles', ['html'], function ()
{
	console.log(path.join(conf.paths.dist,'/styles/'));

	return gulp.src([
			path.join(conf.paths.dist,'/styles/app-*.css')
			])
			.pipe($.replace("resources/assets/","assets/"))
			.pipe(gulp.dest(path.join(conf.paths.dist,'/styles/')));
});

gulp.task('replace', ['replaceStyles'], function ()
{
	console.log(path.join(conf.paths.dist,'/scripts/'));

	return gulp.src(path.join(conf.paths.dist,'/scripts/app-*.js'))
			.pipe($.replace("/app/main/components/", "app/main/components/"))
			.pipe($.replace("resources/angularjs/", "app/"))
			.pipe($.replace("../../../resources/angularjs/","app/"))
			.pipe($.replace("../../../app/","app/"))
			.pipe($.replace("../../../resources/assets/","assets/"))
			.pipe($.replace("resources/assets/","assets/"))
			.pipe(gulp.dest(path.join(conf.paths.dist,'/scripts/')));
});

gulp.task('minifyJson', ['replace'], function ()
{
	var fileFilter = $.filter(function (file)
	{
		return file.stat.isFile();
	});

	return gulp.src([
			path.join(conf.paths.dist, '/app/**/*.json')
		])
		.pipe(fileFilter)
		.pipe(jsonminify())
		.pipe(gulp.dest(path.join(conf.paths.dist, '/app')));
});

gulp.task('removeLogs', ['minifyJson'], function ()
{
	
	return gulp.src([
			path.join(conf.paths.dist,'/scripts/app-*.js')
			])
		.pipe(stripDebug())
		.pipe(gulp.dest(path.join(conf.paths.dist,'/scripts/')));
});

gulp.task('clean', function ()
{
	// not work in parallel
	return $.del([
					path.join(conf.paths.dist, '/'), 
					path.join(conf.paths.tmp, '/'),
					"!" + path.join(conf.paths.dist, '/index.php'), 
					"!" + path.join(conf.paths.dist, '/.htaccess'), 
					"!" + path.join(conf.paths.dist, '/web.config'), 
					"!" + path.join(conf.paths.dist, '/robots.txt'), 
				], {force: true}).then(paths => {
				    console.log('Deleted files and folders:\n', paths.join('\n'));
				});;
});

gulp.task('build', ['removeLogs', 'fonts', 'other', 'i18n', 'assets']);