const gulp = require('gulp');
const nodemon = require('gulp-nodemon');
const browserSync = require('browser-sync');
const pug = require('gulp-pug');
const sass = require('gulp-sass');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');
const sourcemaps = require('gulp-sourcemaps');
const notifier = require('node-notifier');
const cached = require('gulp-cached');
const changed = require('gulp-changed');
const sassInheritance = require('gulp-sass-inheritance');
const pugInheritance = require('gulp-pug-inheritance');
const gulpIf = require('gulp-if');
const filter = require('gulp-filter');
const uglify = require('gulp-uglify');
const pump = require('pump');
const path = require('path');
const fs = require('fs');
const execSync = require('child_process').execSync;

const env = require('./env');
const mode = require('./mode');

gulp.task('browsersync', function() {
    if (mode.watch) {
        browserSync.init({
            files: [env.structure_path.public_path + '/**/*.*'],
            proxy: mode.internal_proxy,
            port: mode.port,
            open: mode.open_on_start
        });
    }
});

gulp.task('serve', ['browsersync'], function() {
    if (mode.watch) {
        nodemon({
            script: './bin/www',
            ext: 'js pug',
            ignore: [
                'node_modules',
                'bin',
                env.structure_path.public_path,
                env.structure_path.resource_path
            ],
            stdout: false
        }).on('readable', function() {
            this.stdout.on('data', function(chunk) {
                if (/^Server started\./.test(chunk)) {
                    browserSync.reload({ stream: false });
                }
                process.stdout.write(chunk);
            });
            this.stderr.on('data', function(chunk) {
                process.stderr.write(chunk);
            });
        });
    }
});

gulp.task('js', function(cb) {
    pump([
            gulp.src('./' + env.structure_path.resource_path + '/' + env.prefix_path.js + '/**/*.js'),
            gulpIf(mode.watch, changed('./' + env.structure_path.public_path + '/' + env.prefix_path.js, {
                extension: '.js'
            })),
            gulpIf(mode.watch, cached('js')),
            gulpIf(mode.minify_js, uglify()),
            gulp.dest('./' + env.structure_path.public_path + '/' + env.prefix_path.js),
            gulpIf(mode.watch, browserSync.reload({
                stream: true
            }))
        ],
        cb
    );
});

gulp.task('pug', function buildHTML() {
    gulp.src([
            './' + env.structure_path.resource_path + '/**/*.pug',
            '!./' + env.structure_path.resource_path + '/**/__*.pug',
        ])
        .pipe(plumber({
            errorHandler: (error) => {
                notifier.notify({
                    'title': 'Error(Pug)',
                    'message': error.message
                });
                console.log(error.message);
            }
        }))
        .pipe(gulpIf(mode.watch, changed('./' + env.structure_path.public_path + '/', {
            extension: '.html'
        })))
        .pipe(gulpIf(mode.watch, cached('pug')))
        .pipe(gulpIf(mode.watch, pugInheritance({
            basedir: './' + env.structure_path.resource_path + '/',
            skip: 'node_modules'
        })))
        .pipe(filter(function(file) {
            return !/\/__/.test(file.path) && !/^__/.test(file.relative);
        }))
        .pipe(pug())
        .pipe(gulp.dest('./' + env.structure_path.public_path + '/'))
        .pipe(gulpIf(mode.watch, browserSync.reload({
            stream: true
        })));
});

gulp.task('scss', function buildCSS() {
    gulp.src('./' + env.structure_path.resource_path + '/' + env.prefix_path.css + '/**/*.scss')
        .pipe(plumber({
            errorHandler: (error) => {
                notifier.notify({
                    'title': 'Error(Scss)',
                    'message': error.message
                });
                console.log(error.message);
            }
        }))
        .pipe(gulpIf(mode.watch, changed('./' + env.structure_path.public_path + '/' + env.prefix_path.css, {
            extension: '.css'
        })))
        .pipe(gulpIf(mode.watch, cached('scss')))
        .pipe(gulpIf(mode.watch, sassInheritance({ dir: './' + env.structure_path.resource_path + '/' + env.prefix_path.css + '/' })))
        .pipe(filter(function(file) {
            return !/\/__/.test(file.path) || !/^__/.test(file.relative);
        }))
        .pipe(sourcemaps.init())
        .pipe(sass({
            indentedSyntax: false,
            outputStyle: 'compressed'
        }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('./' + env.structure_path.public_path + '/' + env.prefix_path.css))
        .pipe(gulpIf(mode.watch, browserSync.reload({
            stream: true
        })));
});

gulp.task('watch', ['js', 'scss', 'pug'], function startWatching() {
    if (mode.watch) {
        watch(['./' + env.structure_path.resource_path + '/' + env.prefix_path.css + '/**/*.scss'], (e) => {
            gulp.start(['scss']);
            if (e.event == 'unlink') {
                const p = revisePath(e.path);
                fs.unlink(p, () => {});
            }
        });
        watch(['./' + env.structure_path.resource_path + '/**/*.pug'], (e) => {
            gulp.start(['pug']);
            if (e.event == 'unlink') {
                const p = revisePath(e.path);
                fs.unlink(p, () => {});
            }
        });
        watch(['./' + env.structure_path.resource_path + '/' + env.prefix_path.js + '/**/*.js'], (e) => {
            gulp.start(['js']);
            if (e.event == 'unlink') {
                const p = revisePath(e.path);
                fs.unlink(p, () => {});
            }
        });
        watch(['./' + env.structure_path.express_path + '/**/*.pug'], (e) => {
            browserSync.reload({ stream: true });
        });
    }
});

function revisePath(p) {
    let ext = path.extname(p);
    const rel = path.relative('./' + env.structure_path.resource_path, p);
    const tg = path.resolve('./' + env.structure_path.public_path, rel);
    const dirname = path.dirname(tg);
    const basename = path.basename(tg, ext);
    //ext変換
    //jsは変換無し
    if (ext == '.pug') {
        ext = '.html';
    } else if (ext == '.scss') { //scss mode
        ext = '.css';
    }
    const fintg = path.join(dirname, basename + ext);
    return fintg;
}

gulp.task('reset', function() {
    const public = './' + env.structure_path.public_path + '/';
    const img = public + env.prefix_path.img;
    const resources = env.structure_path.resource_path + '/';
    const rec_img = resources + env.prefix_path.img;
    let query = '';
    query += 'find ' + public + ' -name "*" | ';
    query += 'grep -v -E "^' + public + '$" | ';
    query += 'xargs -L 1 rm -rvf && ';
    query += 'ln -s ../' + rec_img + ' ' + img + ' ';
    execSync(query);
});

gulp.task('default', ['reset', 'watch', 'serve']);