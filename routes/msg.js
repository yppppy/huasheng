var express = require('express');
var router = express.Router();
var Users = require('../models/UserModel');
var sequelize =require('../models/ModelHeader')();
var Msg = require('../models/MsgModel');
/* GET home page. */



router.post('/sendmsg', function(req, res, next) {
  loginbean = req.session.loginbean
  res.locals.loginbean = loginbean;
 //  接参
  nicheng = req.body.nicheng;
  arr = nicheng.split(';');
  len = arr.length;
  sql = 'select id from users where nicheng=?';
  sqlmsg = 'insert into msgs set sendid=?,toid=?,message=?';
  sqlupd = 'update users set msgnum=msgnum+1 w`1	here id=?';
 // fails=[];
  success=[];
  flag=0;//标志位  【用来判断是不是所有的昵称都执行了[无论错误还是成功flag++，直到flag=arr。length时 表明所有的操作都完成了]】
  //闭包（互不影响）
  var exec=function(i){
  	//保存了i的值
  	toids={}

  	return function(){
  		sequelize.query(sql,{replacements: [arr[i]]}).then(function(rs){
		 	rsjson = JSON.parse(JSON.stringify(rs[0])); //rowdatapacke转json
		 	if(rsjson.length==0){
		 		flag++;
		 		//fails.push(arr[i]);
		 		return;
		 	}
		 	toids[i] = rsjson[0].id;//用i保存住id【因为i是固定的不会被覆盖】
		 	// 然后插入消息表
		 	sequelize.query(sqlmsg,{replacements: [loginbean.id,toids[i],req.body.message]}).then(function(rs){
		 		sequelize.query(sqlupd,{replacements: [toids[i]]}).then(function(rs){
		 			flag++;
		 			 success.push(arr[i]);
		 			if(flag==len){
                      
		 				res.send (success);
		 			}
		 		})
		 	})
		 });
  	}
  }
  for(i=0;i<len;i++){
  	fun=exec(i);
  	fun();
  }
 // 用昵称查找对应的uid
 
 
	// 更新user表msgnum+1
	// 返回客户端，客户端收到后弹成功，关闭模态框

});





router.post('/reply', function(req, res, next) {
	loginbean=req.session.loginbean
    res.locals.loginbean = loginbean;
  //nicheng=req.body.nicheng2;
  //console.log(nicheng);
  message=req.body.message;
  toid=req.body.sendid;

   
 //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return Users.update({msgnum:sequelize.literal('msgnum+1')},{where:{'id':toid}},{transaction:t}).then(function(rs){
            msg={};
            msg.sendid=loginbean.id;
            msg.toid=toid;
            msg.message=message;
            return Msg.create(msg,{transaction:t}).then(function(rs){
          
          res.send("1");

            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
            res.send("2");
           
          })
          
        });
      //-----------------结束事物---------------------------------------

})



router.get('/delMsg', function(req, res, next) {
	loginbean=req.session.loginbean
    res.locals.loginbean = loginbean;

  id=req.query.id;
   console.log(id);

 //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return Users.update({msgnum:sequelize.literal('msgnum-1')},{where:{'id':loginbean.id}},{transaction:t}).then(function(rs){
         
          return Msg.destroy({where:{'id':id}},{transaction:t}).then(function(rs){
          
       res.redirect('/home');

            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
             console.log(err);
           
          })
          
        });
      //-----------------结束事物---------------------------------------

})

module.exports = router;
