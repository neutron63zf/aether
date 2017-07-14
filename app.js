var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');

var env = require('./env');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, env.structure_path.express_path));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, env.structure_path.public_path)));

//read and use js recursively

((files) => {
    files.filter((p) => {
        return path.extname(p) == '.js';
    }).map((p) => {
        p = './' + p;
        let rdir = path.dirname(path.relative('./' + env.structure_path.express_path, p));
        const basename = path.basename(p, '.js');
        const jsfile = path.dirname(p) + '/' + path.basename(p, '.js');
        let tgn = basename;
        if (rdir == '.') {
            //route level express app
            rdir = '';
        }
        rdir = '/' + rdir;
        if (basename == 'index') {
            tgn = '';
        }
        let tg;
        if (rdir == '/') {
            //route level express app
            tg = rdir + tgn;
        } else {
            tg = rdir + '/' + tgn;
        }
        app.use(tg, require(jsfile));
    });
})((function walkSync(dir, filelist) {
    var fs = fs || require('fs'),
        files = fs.readdirSync(dir);
    filelist = filelist || [];
    files.forEach(function(file) {
        if (fs.statSync(dir + '/' + file).isDirectory()) {
            filelist = walkSync(dir + file + '/', filelist);
        } else {
            filelist.push(path.join(dir, file));
        }
    });
    return filelist;
})('./' + env.structure_path.express_path + '/'));

// catch 404 and forward to error handler
// if .html exists, send it
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    var p = __dirname + '/' + env.structure_path.public_path + req.url + '.html';
    if (fs.existsSync(p)) {
        res.sendFile(p);
    } else {
        err.status = 404;
        next(err);
    }
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;