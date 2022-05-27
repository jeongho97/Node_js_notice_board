var express=require('express');
var app=express.Router();

var db_config=require('../config/database.js');
var conn=db_config.init();

var bodyParser=require('body-parser');
const { response } = require('express');
const Connection = require('mysql/lib/Connection');
app.use(bodyParser.urlencoded({extended:true}));

app.get('/bbslist',function(req,res){
    console.log('bbslist 접속 성공');
    console.log("req.session.member.id:"+ req.session.member.ID); //session 값 받아오는 부분

    var choice=req.query.choice;
    var search = req.query.search;
    var pageNumber=req.query.pageNumber;

    if(pageNumber==undefined) pageNumber=1;

    //총 글의 갯수
    var totalCount=0;

    var sql=" SELECT IFNULL(COUNT(*),0) as cnt  "
           +" FROM BBS ";
    var sqlWord="";
    if(choice == "title" & !search==""){
        sqlWord = " WHERE DEL=0 AND TITLE LIKE '%"+search+"%' ";
    }else if(choice=="content"){
        sqlWord = " WHERE DEL=0 AND CONTENT LIKE '%"+search+"%' ";
    }else if(choice=="writer"){
        sqlWord = " WHERE DEL=0 AND ID='" + search + "' ";
    }
    sql+=sqlWord;
    console.log("sql: "+sql);

    conn.query(sql,function(err,result){
        if(err) console.log(err);

        console.log(result[0].cnt);
        totalCount=result[0].cnt;
    });

    // 페이지 계산
    var sn=pageNumber-1;     //0   1   2
    var start = sn * 10 + 1; //1   11  21
    var end = (sn + 1) * 10; //10  20  30

    //페이지에 글을 나타내기 위해 1페이지에서는 행 번호가 1부터 10번까지만 뽑아내고 2페이지에서는 행 번호가 11부터 20번 까지만 뽑아내는 과정을 반복한다
    sql= " SELECT SEQ, ID, REF, STEP, DEPTH, "
       + "        TITLE, CONTENT, WDATE, DEL, READCOUNT "
       + " FROM ";

    sql += "   (SELECT ROW_NUMBER()OVER(ORDER BY REF DESC, STEP ASC) AS RNUM, "
         + "           SEQ, ID, REF, STEP, DEPTH, "
         + "           TITLE, CONTENT, WDATE, DEL, READCOUNT "
         + "    FROM BBS ";
        sqlWord="";
        if(choice == "title"  & !search==""){
            sqlWord = " WHERE DEL=0 AND TITLE LIKE '%"+search+"%' ";
        }else if(choice=="content"){
            sqlWord = " WHERE DEL=0 AND CONTENT LIKE '%"+search+"%' ";
        }else if(choice=="writer"){
            sqlWord = " WHERE DEL=0 AND ID='" + search + "' ";
        }
        sql += sqlWord;

        sql += "      ORDER BY REF DESC, STEP ASC) a ";
        sql += " WHERE RNUM BETWEEN " + start + " AND " + end;

    console.log("sql: "+sql);

    conn.query(sql, function(err,results){
        if(err) console.log(err);

        console.log(JSON.stringify(results));

        res.render('bbslist.ejs',{
            user:req.session.member.ID,
            data:results,
            totalCount:totalCount,
            pageNumber:pageNumber,
            choice:choice,
            search:search
        });

    });
    /* 
    내가 한거
    var sql=" SELECT SEQ, ID, REF, STEP, DEPTH, "
           +"          TITLE, CONTENT, WDATE, DEL, READCOUNT "
           +"       FROM BBS "
           +"       ORDER BY REF DESC, STEP ASC ";

    conn.query(sql,function(err,results,fields){
        if(err) console.log(err);

        console.log(JSON.stringify(results));
        res.render('bbslist.html',{user:req.session.member.id, data:results}); //html로 넘길때
        //res.render('bbslist.ejs', {user:req.session.member.id, data:results}); //ejs로 넘길때
    }) */

    
});
app.get("/bbsdetail",function(req,res){
    console.log("bbsdetail 접속 성공");
    var seq=req.query.seq;
    console.log(seq);
    var sql=" SELECT SEQ, ID, REF, STEP, DEPTH, "
           +"          TITLE, CONTENT, WDATE, DEL, READCOUNT "
           +"       FROM BBS "
           +"       WHERE SEQ=?";
    var sql2=" UPDATE BBS "
            + " SET READCOUNT=READCOUNT+1 "
            + " WHERE SEQ=? ";
    var param=[seq];

    conn.query(sql2,param,function(err,result,fields){
        if(err) console.log(err);

        if(result.affectedRows>0){
            console.log("조회수+1")
        }else{
            console.log("조회수 업데이트 실패")
        }
    });

    conn.query(sql,param,function(err,results,fields){
        if(err) console.log(err);

        console.log(JSON.stringify(results));
        res.render('bbsdetail.ejs',{

            user:req.session.member.ID,
            data:results
        });
    });
});
app.post("/bbswriteAf",function(req,res){
    console.log("bbswriteAf 접속 성공");
    var id=req.session.member.ID;
    var title=req.body.title;
    var content=req.body.content;
    console.log(id+" "+title+" "+content);
    var sql="INSERT INTO BBS(ID, REF, STEP, DEPTH, TITLE, CONTENT, WDATE, DEL, READCOUNT) "
    +" VALUES(?, (SELECT IFNULL(MAX(REF), 0)+1 FROM BBS a),0,0, ?,?,NOW(),0,0) ";
    var params=[id,title,content];

    conn.query(sql,params,function(err,result,fields){
        if(err) console.log(err);

        console.log(JSON.stringify(result));

        if(result.affectedRows>0){
            console.log("글등록에 성공 하였습니다")
            res.render('../message/message.ejs',{proc:"write",msg:"OK"});
        }else{
            console.log("글등록에 실패하였습니다")
            res.render('../message/message.ejs',{proc:"write",msg:"NG"});
        }
    });
})
app.get('/bbswrite',function(req,res){
    console.log('bbswrite 접속 성공!');
    res.render('bbswrite.ejs',{
        user:req.session.member.ID
    }); //뿌린다! (가라!)
});
app.get('/answer',function(req,res){
    console.log('answer 접속 성공!');
    var seq=req.query.seq;
    var sql=" SELECT SEQ, ID, REF, STEP, DEPTH, "
    +"          TITLE, CONTENT, WDATE, DEL, READCOUNT "
    +"       FROM BBS "
    +"       WHERE SEQ=?";
    var params=[seq];

    conn.query(sql,params,function(err,results,fields){
    if(err) console.log(err);

    console.log(JSON.stringify(results));
    res.render('answer.ejs',{
        user:req.session.member.ID,
        data:results
        });
    });
});
app.post('/answerAf',function(req,res){
    console.log('answerAf 접속 성공!');
    var id=req.session.member.ID;
    var seq=req.body.seq;
    var title=req.body.title;
    var content=req.body.content;
    console.log(seq+" "+title+" "+content);

    //update 이미 달려있는 답글들의 STEP(행)을 미리 1씩 증가 시켜놓음
		var sql1=" UPDATE BBS "
                +" SET STEP=STEP+1 "
                +" WHERE REF = (SELECT REF FROM (SELECT REF FROM BBS a WHERE SEQ=?) A ) " //select를 두번쓴 이유는 mysql상 alias를 해줘서 값을 넘겨줘야 오류가 안생긴다. 오라클은 오류x
                +" AND STEP > (SELECT STEP FROM (SELECT STEP FROM BBS b WHERE SEQ=?) B ) ";
    //insert 답글을 달 해당 글의 STEP보다 1 증가시키고 오른쪽으로 한칸 움직여서 구분해주기 위해 DEPTH를 기존 글의 DEPTH보다 1 크게 증가시킨다
        var sql2=" INSERT INTO BBS(ID, REF, STEP, DEPTH, TITLE, CONTENT, WDATE, DEL, READCOUNT) "
                +" VALUES(?, "
                +"            (SELECT REF FROM BBS a WHERE SEQ=?), "
                +"            (SELECT STEP FROM BBS b WHERE SEQ=?) + 1, "
                +"            (SELECT DEPTH FROM BBS b WHERE SEQ=?) + 1, "
                +"        ?, ?, NOW(), 0, 0)";
        
        var params1=[seq,seq];
        var params2=[id,seq,seq,seq,title,content];


        conn.query(sql1,params1,function(err,result,fields){
            if(err) console.log(err)
            else{
                console.log("answer update success")
            }

        });

        conn.query(sql2,params2,function(err,result,fields){
            if(err) console.log(err)

            if(result.affectedRows>0){
                console.log("answer insert success")
                res.render('../message/message.ejs',{proc:"answer",msg:"OK"});
            }else{
                console.log("answer insert fail")
                res.render('../message/message.ejs',{proc:"answer",msg:"NG"});
            }
        });

});
app.get('/update',function(req,res){
    console.log("update 접속 성공!");
    var id=req.session.member.ID;
    var seq=req.query.seq;

    var sql=" SELECT SEQ, ID, REF, STEP, DEPTH, "
           +"          TITLE, CONTENT, WDATE, DEL, READCOUNT "
           +"       FROM BBS "
           +"       WHERE SEQ=?";
    var param=[seq];

    conn.query(sql,param,function(err,results,fields){
        if(err) console.log(err);

        res.render('update.ejs',{
            user:id,
            data:results
        });
    });
});

app.post('/updateAf',function(req,res){
    console.log("updateAf 접속 성공!");
    var id=req.session.member.ID;
    var title=req.body.title;
    var content=req.body.content;
    var seq=req.body.seq;
    console.log(seq+" "+title+" "+content);

    var sql=" UPDATE BBS SET TITLE=?,WDATE=NOW(), CONTENT=? WHERE SEQ=? ";
    var params=[title,content,seq];

    conn.query(sql,params,function(err,result,fields){
        if(err) console.log(err)

        if(result.affectedRows>0){
            console.log("글 수정 완료")
            res.render('../message/update_message.ejs',{
                proc:"updateAf",
                msg:"OK",
                seq:seq
            });
        }else{
            console.log("글 수정 실패")
            res.render('../message/update_message.ejs',{
                proc:"updateAf",
                msg:"NG",
                seq:seq
            });
        }
    });
});

app.get('/delete',function(req,res){
    console.log("delete 접속 성공!")
    var seq=req.query.seq;
    console.log(seq);

    var sql=" UPDATE BBS SET DEL=1 WHERE SEQ=? ";
    var param=[seq];

    conn.query(sql,param,function(err,result,fields){
        if(err) console.log(err)

        if(result.affectedRows>0){
            console.log("글 수정 완료")
            res.render('../message/message.ejs',{proc:"delete",msg:"OK"});
        }else{
            console.log("글 수정 실패")
            res.render('../message/message.ejs',{proc:"delete",msg:"NG"});
        }
    });
});
module.exports=app;