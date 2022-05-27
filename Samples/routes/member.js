var express = require('express');
var app = express.Router();

//DB
var db_config=require('../config/database.js');
var conn=db_config.init();

// parameter를 받기 위한 설정 checkid에서 post할때 body.id를 받아올때 필요
var bodyParser=require('body-parser');
app.use(bodyParser.urlencoded({extended:true}));

var session = require('express-session'); //npm install express-session
//session
app.use(session({
    secret:'keyboard cat', //암호화
    resave: false,
    saveUninitialized:true
}));

app.get('/login',function(req,res){
    console.log('login 접속 성공!');

    res.render('login.html'); //뿌린다! (가라!)
});

app.get('/regi',function(req,res){
    console.log('regi 접속 성공!');

    res.render('regi.html'); //view 이동 뿌린다! (가라!)
});

app.post('/checkid',function(req,res){
    console.log("checkId 접속 성공!");
    console.log(req.body.id)

    var sql = "SELECT COUNT(*) as cnt FROM MEMBER WHERE ID=? ";
    var param=[req.body.id];

    conn.query(sql,param,function(err,result, fields){
        if(err) console.log(err);

        console.log("결과: " + JSON.stringify(result));

        if(result[0].cnt==0){
            res.send({result:'OK'});
            console.log("OK")
        }else{
            res.send({result:'NO'});
            console.log("NO")
        }

    });

    
});
app.post('/regiAf',function(req,res){
    console.log("regiAf 접속 성공!");
    console.log(req.body.id+" "+req.body.pwd+" "+req.body.name+" "+req.body.email);

    var id=req.body.id; //parameter는 무조건 html에서 name값으로 가져온다
    var pwd=req.body.pwd;
    var name=req.body.name;
    var email=req.body.email;

    var sql=" INSERT INTO MEMBER(ID,PWD,NAME,EMAIL,AUTH) "
            +" VALUES(?,?,?,?,3) ";
    
    var params=[id,pwd,name,email];

    conn.query(sql,params,function(err,result,fields){
        if(err) console.log(err);

        console.log("회원가입 결과: "+JSON.stringify(result));
        console.log(result.affectedRows);
        
        if(result.affectedRows>0){
            console.log("회원가입이 완료 되었습니다")
            res.render('../message/message.ejs',{proc:"regi",msg:"OK"});
        }else{
            console.log("회원가입에 실패하였습니다")
            res.render('../message/message.ejs',{proc:"regi",msg:"NG"});
        }
    });
});
app.post('/loginAf',function(req,res){
    console.log("loginAf 접속 성공!");

    var id=req.body.id;
    var pwd=req.body.pwd;

    console.log(id+" "+pwd);

    var sql=" SELECT * FROM MEMBER WHERE ID=? AND PWD=? ";

    var params=[id,pwd];

    console.log(sql);

    conn.query(sql,params,function(err,result,fields){
        if(err) console.log(err);

        console.log("로그인 결과"+JSON.stringify(result));

        if(result.length>0){
            //session
            //id만 저장하고 싶을 경우
            //req.session.user_id=results[0].id;
            //회원정보를 저장하고 싶은 경우
            req.session.member=result[0];

            console.log("req.session.member:"+req.session.member);
            console.log(req.session.member.ID);
            console.log("로그인에 성공하였습니다");
            res.render('../message/message.ejs',{proc:"login",msg:"OK"});

        }else{
            console.log("로그인에 실패하였습니다");
            res.render('../message/message.ejs',{proc:"login",msg:"NO"});
        }
    });
});






/* //접근
const req = require('express/lib/request');
req.session.user_id=results[0].id; //id만 저장
req.session.member=results[0] //id,name,email */
module.exports=app;