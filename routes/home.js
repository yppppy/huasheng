var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var PrivateInfoModel = require('../models/PrivateInfoModel');
var Users = require('../models/UserModel');
var sequelize =require('../models/ModelHeader')();
var Msg = require('../models/MsgModel');
var ShopModel = require('../models/ShopModel');

var GoodsModel = require('../models/GoodsModel');
/* GET home page. */
router.get('/', function(req, res, next) {
  req.session.loginbean.msgnum=0;
  //sconsole.log(req.session.loginbean.msgnum);
  res.locals.loginbean = req.session.loginbean;
if(loginbean.role>0){
    cpage=1;
    if(req.query.cpage){
      cpage=req.query.cpage;
    }
    pageItem=3;    //每页显示条目数
    startPoint = (cpage-1)*pageItem; //查询起点位置
    rowCount=0;   //总记录数
    sumPage=0;   //总页数

    //----------查询消息列表-------------------
    sqlCount = 'select count(*) as count  from msgs where toid=?';
    sequelize.query(sqlCount,{replacements: [loginbean.id],type: sequelize.QueryTypes.QUERY}).then(function(rs){
        rsjson = JSON.parse(JSON.stringify(rs[0]));
        rowCount=rsjson[0].count;
        sumPage=Math.ceil(rowCount/pageItem);//Math.floor,Math.round
        sql = 'select m.*,u.nicheng  from msgs m,users u where m.toid=? and m.sendid=u.id limit ?,?';
        sequelize.query(sql,{replacements: [loginbean.id,startPoint,pageItem],type: sequelize.QueryTypes.QUERY}).then(function(rs){
          res.render('home/home', {rs:rs[0]});
        });
    })
    //Msg.findAll({where:{toid:loginbean.id}}).then(function(rs){
    
  }else{
    res.send('<script>alert("你无权访问此页面");location.href="/";</script>');
  }
 
});




 

router.post('/privateAuth', function(req, res, next) {
	var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/privateauth/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
       //res.send('rname='+fields.realname);
       //-----------入库------------
       loginbean = req.session.loginbean;
       fields.id = loginbean.id;
       fields.idphoto=files.idphoto.path.replace('public','');
       fields.userphoto=files.userphoto.path.replace('public','');
       fields.updtime=new Date();
       //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return PrivateInfoModel.create(fields).then(function(rs){
            //------修改User表中的role为2------
            return Users.update({role:2},{where:{'id':loginbean.id}}).then(function(rs){
              //console.log(rs);
              loginbean.role=2;
              req.session.loginbean=loginbean;
              res.send('身份认证已提交,请耐心等待审核');
            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
            console.log(err);
            if(err.errors[0].path=='PRIMARY'){
              res.send('你已经申请过');
            }else if(err.errors[0].path=='idcodeuniq')
            {
              res.send('身份证号已用过');
            }else if(err.errors[0].path=='prphoneuniq'){
              res.send('电话号码已用过');
            }else if(err.errors[0].path=='premailuniq'){
              res.send('此email已用过');
            }else{
              res.send('数据库错误,稍后再试');
            }
          })
          
        });
      //-----------------结束事物---------------------------------------
    })
});







router.post('/sendInfo', function(req, res, next) {
loginbean = req.session.loginbean;
  res.locals.loginbean =loginbean ;

  id=req.body.id;
  message=req.body.message;
 //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return Users.update({msgnum:sequelize.literal('msgnum+1')},{where:{'id':parseid}},{transaction:t}).then(function(rs){
            msg={};
            msg.sendid=loginbean.id;
            msg.toid=id;
            msg.message=message;
            return Msg.create(msg,{transaction:t}).then(function(rs){
          
          res.send("回复成功");

            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
            console.log(err);
           
          })
          
        });
      //-----------------结束事物---------------------------------------


 

   });




router.get('/pubShop', function(req, res, next) {
  sql = 'select id,typename from shoptypes';
  sequelize.query(sql).then(function(rs){
    if(req.query.type=='u'){
      console.log(rs[0]);
      res.send(rs[0]);

    }else{
    res.render('home/pubShop', {shoptypeRs:rs[0]});
  }
  });
})

router.post('/pubShop', function(req, res, next) {
  var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/shop/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
       //res.send('rname='+fields.realname);
       //-----------入库------------
       loginbean = req.session.loginbean;
       fields.uid = loginbean.id;
       fields.photourl=files.photourl.path.replace('public','');
       //------------启动事物----------------------------------
       sequelize.transaction().then(function (t) {
           return ShopModel.create(fields).then(function(rs){
            //------修改User表中的role为4------
            return Users.update({role:4},{where:{'id':loginbean.id}}).then(function(rs){
              //console.log(rs);
              loginbean.role=4;
              req.session.loginbean=loginbean;
              res.redirect('./shopmanage');
            });
          }).then(t.commit.bind(t)).catch(function(err){
            t.rollback.bind(t);
            console.log(err);
            res.send('店铺发布失败，请重新发布');
          })
          
        });
      //-----------------结束事物---------------------------------------
    })
})

router.get('/shopmanage', function(req, res, next) {
  //权限判定
 loginbean = req.session.loginbean;

 if(loginbean.role==4){

 sql = 'select id,typename from shoptypes';
  sequelize.query(sql).then(function(shoptypeRs){
 ShopModel.findOne({where:{uid:loginbean.id}}).then(function(rs){//rs是object
//-------查询店铺中的商品列表------------
         cpage=1;
          if(req.query.cpage){
            cpage=req.query.cpage;
          }
          pageSize=2;
          GoodsModel.count({where:{uid:loginbean.id}}).then(function(countRs){
            console.log(countRs);
            rowCount=countRs;
            sumPage=Math.ceil(rowCount/pageSize);//Math.floor,Math.round
            GoodsModel.findAll({where:{uid:loginbean.id},offset:(cpage-1)*pageSize,limit:pageSize}).then(function(goodsRs){//goodsRs是数组
           console.log(goodsRs);
          res.render('home/shopmanage', {rs:rs,shoptypeRs:shoptypeRs[0],goodsRs:goodsRs,tagflag:req.query.tagflag});


           
             });
             });
      });
   });
}else {
  
   res.send('<script>alert("你还没发布店铺！！！");location.href="/";</script>');
}
});



router.post('/updateShop', function(req, res, next) {

loginbean = req.session.loginbean;

 if(loginbean.role==4){

   var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/shop/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
        console.log("aaa"+fields.judgeImg);
        if(fields.judgeImg==""){//说明没有更改图片
          console.log("ddd");
           ShopModel.update({shopname:fields.shopname, 
            shopintr:fields.shopintr, shoptype:fields.shoptype,  keywords: fields.keywords},
    {where:{'uid':loginbean.id}}).then(function(rs){

   res.redirect("./shopmanage");

  });

        }else{//更新了图片
         
         fields.photourl=files.photourl.path.replace('public','');
         ShopModel.update({shopname:fields.shopname, photourl:fields.photourl, shopintr:fields.shopintr, shoptype:fields.shoptype,  keywords: fields.keywords},
    {where:{'uid':loginbean.id}}).then(function(rs){

   res.redirect("./shopmanage");

  });
}            
 });
}else {
  
   res.send('<script>alert("你还没发布店铺！！！");location.href="/";</script>');
}


});



router.post('/stopShop', function(req, res, next) {

loginbean = req.session.loginbean;

 if(loginbean.role==4){

   console.log(req.body.stopreason);
  
  // ShopModel.update({liveflag:1,stopreason:req.body.stopreason},
  //   {where:{'uid':loginbean.id}} ).then(function(rs){

  //  res.redirect("./shopmanage");

  // });
      sql = 'update shops set liveflag=?, stopreason=? where uid=? ';
        sequelize.query(sql,{replacements: [1,req.body.stopreason,loginbean.id]}).then(function(rs){
         res.redirect("./shopmanage");
        });        
 
}else {
  
   res.send('<script>alert("你还没发布店铺！！！");location.href="/";</script>');
}


});



router.get('/updatePos', function(req, res, next) {
  //权限判定
 loginbean = req.session.loginbean;

 if(loginbean.role==4){

ShopModel.update({ lng:req.query.lng , lat:req.query.lat},
    {where:{'uid':loginbean.id}} ).then(function(rs){

   res.send("搬家成功！");

  });
 
}else {
  
   res.send('<script>alert("你还没发布店铺！！！");location.href="/";</script>');
}
});


router.post('/pubgoods', function(req, res, next) {
    var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/goods/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 
       //-----------入库------------
       loginbean = req.session.loginbean;
       fields.uid = loginbean.id;
       fields.goodsimg=files.goodsimg.path.replace('public','');
       console.log('----------------------');
       console.log(fields.editorValue);
       console.log('----------------------');
       fields.goodsintro=fields.editorValue;
       fields.createtime=new Date();
       //------------启动事物----------------------------------
       GoodsModel.create(fields).then(function(rs){
          console.log(rs);
          res.redirect('./shopmanage?tagflag=1');
       }).catch(function(err){
          console.log(err);
          res.send('创建失败');
       })
       
      //-----------------结束事物---------------------------------------
    })
})


router.post('/goodsById', function(req, res, next) {
      console.log("dddd ");
  //权限判定
  id=req.body.id;
 loginbean = req.session.loginbean;

  GoodsModel.findOne({where:{id:id}}).then(function(goods){
  console.log(goods);
         if(req.body.type=="upd"){
         res.send(goods);
       }else{
       
res.render('home/goodsinfo', {rs:goods});

  }
             });
      
   

});


router.post('/updgoods', function(req, res, next) {


loginbean = req.session.loginbean;

 if(loginbean.role==4){

   var form = new formidable.IncomingForm();   //创建上传表单 
    form.encoding = 'utf-8';        //设置编辑 
    form.uploadDir = './public/images/goods/';     //设置上传目录 文件会自动保存在这里 
    form.keepExtensions = true;     //保留后缀 
    form.maxFieldsSize = 5 * 1024 * 1024 ;   //文件大小5M 
    form.parse(req, function (err, fields, files) { 
        if(err){ 
            console.log(err); 
            return;
        } 

         
       goodsimg=files.goodsimg.path.replace('public','');
       console.log('----------------------');
        console.log(fields.imgg);
      //  console.log(isEmpty(fields.imgg));
       console.log('----------------------');
       goodsintro=fields.editorValue;
       
       if(fields.imgg==""){
          GoodsModel.update({goodsname:fields.goodsname,  goodsintro:goodsintro,  price:fields.price,  typeid: fields.typeid},
        {where:{'id':fields.goods}}).then(function(rs){

          res.redirect("./shopmanage?tagflag=1");

        
  });
      }else{
        console.log("Jmjkkkkkkkkkkkk");
       GoodsModel.update({goodsname:fields.goodsname, goodsimg:goodsimg, goodsintro:goodsintro,  price:fields.price,  typeid: fields.typeid},
        {where:{'id':fields.goods}}).then(function(rs){

          res.redirect("./shopmanage?tagflag=1");

  });
      }
              
 });
}else {
  
   res.send('<script>alert("你还没发布店铺！！！");location.href="/";</script>');
}


});




router.get('/delGoods', function(req, res, next) {
  id=req.query.id;
  console.log(id);
  GoodsModel.destroy({where:{'id':id}}).then(function(rs){
     res.redirect("./shopmanage?tagflag=1");
  });
})

module.exports = router;