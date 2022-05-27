const mysql = require('mysql');

//mysql 접속설정
const db_info = {
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '1234',
    database: 'mydb'
};

module.exports={
    init:function(){
        return mysql.createConnection(db_info);
    }
}