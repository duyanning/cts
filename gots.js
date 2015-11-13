var fs = require('fs');
var execSync = require('child_process').execSync;
//var process = require('process');


// 从目录dir开始扫描
// 需要忽略一些目录，可设置.gotsignore文件。假设我这个软件叫gots(Go TypeScript)
var scan = function(dir, callback) {
  var children;
  children = fs.readdirSync(dir);
  //console.log(children);

  var i;
  var name;
  var path;
  for (i = 0; i < children.length; i++) {
    //console.log(children[i]);
    //console.log(isTypeScript(children[i]));
    name = children[i];
    path = dir + '/' + name;
    if (fs.statSync(path).isDirectory()) { // 如果是目录，就递归扫描
      scan(path, callback);
    }
    else {                      // 如果是文件，就交由callback函数处理
      callback(path);
    }
  }

};

var patDotTS = new RegExp('\\.ts$'); // .在正则表达式中有特殊含义，要用\对它转义，但\在JavaScript中也有特殊含义，自己也需转义
var isTypeScript = function (name) {
  return patDotTS.test(name);
};

var patDotJS = new RegExp('\\.js$');
var isJavaScript = function (name) {
  return patDotJS.test(name);
};

var files = [];       // 搜集到的文件列表。元素为从.开始的文件路径
// 扫描，搜集没有对应.ts的.js，以及需要编译的.ts
scan('.', function (path) {
  var ts, js;
  var tsTime, jsTime;

  if (isJavaScript(path)) {
    js = path;
    ts = js.replace(patDotJS, '.ts');

    if (!fs.existsSync(ts)) {
      //console.log(js);
      files.push(js);
    }
  }
  else if (isTypeScript(path)) {
    ts = path;
    js = ts.replace(patDotTS, '.js'); // /.ts/
    if (!fs.existsSync(js)) {
      //console.log(ts);
      files.push(ts);
    }
    else {
      tsTime = fs.statSync(ts).mtime;
      jsTime = fs.statSync(js).mtime;
      if (jsTime < tsTime) {
        //console.log(ts);
        files.push(ts);
      }
    }
  }
});

var compile = function (tsPath) {
  var compileCmd;
  console.log('Compiling ' + tsPath);
  compileCmd = 'tsc --noEmitOnError ' + tsPath;
  try {
    execSync(compileCmd);       // 如果退出状态非0，会导致异常发生。除此外，并无其他获得退出状态的办法
  }
  catch (err) {
    console.log(err.stdout.toString());
    //console.log('error found!');
    return 1;
  }
};

var lint = function (jsPath) {
  var lintCmd;
  console.log('Linting ' + jsPath);
  lintCmd = 'lint ' + jsPath;
  try {
    execSync(lintCmd);       // 如果退出状态非0，会导致异常发生。除此外，并无其他获得退出状态的办法
  }
  catch (err) {
    console.log(err.stdout.toString());
    //console.log('error found!');
  }
};

var exitCode;
var i;
for (i = 0; i < files.length; i++) {
  if (isTypeScript(files[i])) {
    exitCode = compile(files[i]);
    if (exitCode != 0) {
      process.exit(exitCode);
      break;
    }
  }
  // else if (isJavaScript(files[i])) {
  //   lint(files[i]);
  // }
}

//process.exit(0);
