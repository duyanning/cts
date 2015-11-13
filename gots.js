var fs = require('fs');
var execSync = require('child_process').execSync;
//var process = require('process');


// ��Ŀ¼dir��ʼɨ��
// ��Ҫ����һЩĿ¼��������.gotsignore�ļ�����������������gots(Go TypeScript)
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
    if (fs.statSync(path).isDirectory()) { // �����Ŀ¼���͵ݹ�ɨ��
      scan(path, callback);
    }
    else {                      // ������ļ����ͽ���callback��������
      callback(path);
    }
  }

};

var patDotTS = new RegExp('\\.ts$'); // .��������ʽ�������⺬�壬Ҫ��\����ת�壬��\��JavaScript��Ҳ�����⺬�壬�Լ�Ҳ��ת��
var isTypeScript = function (name) {
  return patDotTS.test(name);
};

var patDotJS = new RegExp('\\.js$');
var isJavaScript = function (name) {
  return patDotJS.test(name);
};

var files = [];       // �Ѽ������ļ��б�Ԫ��Ϊ��.��ʼ���ļ�·��
// ɨ�裬�Ѽ�û�ж�Ӧ.ts��.js���Լ���Ҫ�����.ts
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
    execSync(compileCmd);       // ����˳�״̬��0���ᵼ���쳣�����������⣬������������˳�״̬�İ취
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
    execSync(lintCmd);       // ����˳�״̬��0���ᵼ���쳣�����������⣬������������˳�״̬�İ취
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
