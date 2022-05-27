var express=require('express');
var app=express();
var path = require('path');
//router 등록
var member = require('./routes/member.js');
var bbs = require('./routes/bbs.js');
app.use(member);
app.use(bbs);

// views(html,ejs) 폴더를 인식
app.set("views",__dirname+"/views") //정해져있다.

//public 폴더 추가

app.use(express.static(path.join(__dirname,'public')));

//ejs 사용하겠다
app.engine('html',require('ejs').renderFile);
app.set('view engine','ejs');

var port = 8090;
var server = app.listen(8090,function(){
    console.log(`server start...port:${port}`);
});


