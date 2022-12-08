const {PythonShell} = require('python-shell')

PythonShell.runString('x=1+1;print(x)', null, function (err) {
    if (err) throw err;
    console.log('finished');
});