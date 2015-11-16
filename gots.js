/*jshint node : true */

var fs = require('fs');
var execSync = require('child_process').execSync;
//var process = require('process');
//var glob = require("glob");     // https://www.npmjs.com/package/glob
var minimatch = require("minimatch"); // https://www.npmjs.com/package/minimatch
//var os = require("os");

var loadDotIgnore = function() {
  var ignoreList = [];
  var negateIgnoreList = [];
  var contents;
  var globList;
  
  // 根据文件.gotsignore的内容构造忽略、不得忽略两个列表
  if (fs.existsSync('.gotsignore')) {
    contents = fs.readFileSync('.gotsignore').toString();
    //console.log(contents);
    globList = contents.split(/\s+/); // os.EOL也行
    //console.log(globList);
    ignoreList = globList;
  }
  

  return function (path) {
    // files = files.filter(minimatch.filter('!abc.ts', {matchBase: true}));
    var i;
    for (i = 0; i < ignoreList.length; i++) {
      if (minimatch(path, ignoreList[i], {matchBase: true})) { // 
        //console.log('ignore ' + path);
        return true;
      }
    }
    
    return false;
  };
  
};

// 从目录dir开始扫描
// 需要忽略一些目录，可设置.gotsignore文件。假设我这个软件叫gots(Go TypeScript)
var scan = function(dir, isIgnored, callback) {
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
    if (dir == '.') {
      path = name;
    }
    else {
      path = dir + '/' + name;
    }

    // 在此处根据.gotsignore对path进行处理
    if (isIgnored(path)) {
      continue;
    }
    
    if (fs.statSync(path).isDirectory()) { // 如果是目录，就递归扫描
      scan(path, isIgnored, callback);
    }
    else {                      // 如果是文件，就交由callback函数处理
      // 目前callback仅仅是收集文件名。在callback中编译也可以。
      // 如果某个文件编译报错，还继续编译其他文件吗？
      // 如果要继续编译其他文件，那收集文件名就是对的。(好像大多编译器都是如此)
      // 如果要立即终止程序，最好放在callback中编译。这样可以编译不必要的搜集。
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

var debug = true;

var compile = function (tsPath) {
  var compileCmd;
  console.log('Compiling ' + tsPath);
  compileCmd = 'tsc --noEmitOnError ' + tsPath;
  try {
    execSync(compileCmd);       // 如果退出状态非0，会导致异常发生。除此外，并无其他获得退出状态的办法
  }
  catch (err) {
    console.log(err.stdout.toString());
    console.log('error found!');
    return 1;
  }
  
  return 0;
};

var lint = function (lintCmd, jsPath) {
  var cmdLn;
  console.log('Linting ' + jsPath);
  cmdLn = lintCmd + ' ' + jsPath;
  try {
    execSync(cmdLn);       // 如果退出状态非0，会导致异常发生。除此外，并无其他获得退出状态的办法
  }
  catch (err) {
    console.log(err.stdout.toString());
    //console.log('error found!');
    return 1;
  }

  return 0;
};

var main = function () {
  var exitCode;
  var i;
  var files = [];       // 搜集到的文件列表。元素为从.开始的文件路径
  var isIgnored;
  var lintCmd = '';

  if (process.argv.length >= 3) { // argv[0]为node arg[1]为脚本名
    lintCmd = process.argv[2];
    if (lintCmd !== 'jslint' && lintCmd !== 'jshint') {
      console.log('invalid lint program name');
      return;
    }
  }

  isIgnored = loadDotIgnore();

  // 扫描，搜集没有对应.ts的.js，以及需要编译的.ts
  scan('.', isIgnored, function (path) {
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

  for (i = 0; i < files.length; i++) {
    if (isTypeScript(files[i])) {
      exitCode = compile(files[i]);
    }
    else if (lintCmd !== '' && isJavaScript(files[i])) {
      exitCode = lint(lintCmd, files[i]);
    }

    // if (exitCode != 0) {
    //   //console.log("exit");
    //   process.exit(exitCode);
    //   break;
    // }

    
  }
};

main();

// var tmp = function () {
//   var options = {};
//   options.root = process.cwd();   // 根目录从当前目录(即.gotsignore所在目录)算起

//   glob("*.ts", options, function (er, files) {
//     console.log(files);
//   });
  
// };
