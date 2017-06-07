var express = require('express');
var router = express.Router();
var GoodsModel = require('../models/GoodsModel');
var ShoppingModel = require('../models/ShoppingModel');
var sequelize =require('../models/ModelHeader')();
var OrderModel = require('../models/OrderModel');

/* GET home page. */
router.get('/putshopping', function(req, res, next) {
	loginbean = req.session.loginbean;
	if(typeof(loginbean)=='undefined'){
		res.send('<script>alert("您没登陆,请登陆后操作");window.close();</script>');
		return;
	}
  //res.locals.loginbean = loginbean;
  //--------查询goods表--------------------------
  goodsid = req.query.goodsid;
  
  GoodsModel.findOne({where:{id:goodsid}}).then(function(goodsRs){
          //--------插入购物意向表----------------------
          syl = {
          	goodsid:goodsid,
          	uid:loginbean.id,
          	price:goodsRs.price,
          	num:1,
          	shopid:goodsRs.shopid,
          	creattime:new Date()
          };
          ShoppingModel.create(syl).then(function(rs){
	          console.log(rs);
	          //--------查询购物意向表---------------------
	          sql = 'select s.id as shoppingid,g.id as goodsid,g.goodsimg,g.goodsname,s.price,s.num,g.shopid from  shoppings s,goods g where s.uid=? and s.orderid=0 and s.goodsid=g.id';
	          sequelize.query(sql,{replacements: [loginbean.id],type: sequelize.QueryTypes.QUERY}).then(function(shopList){
	          	//--------显示购物车---------------------------
	          	rsjson = JSON.parse(JSON.stringify(shopList[0]));
	          	res.render('buy/shoppingcar',{shopList:rsjson});
	          });
	       }).catch(function(err){
	          console.log(err);
	          if(err.errors[0].path=='shoppinguniq')
			  {
				ShoppingModel.update({num:sequelize.literal('num+1')},{where:{'goodsid':goodsid,'uid':loginbean.id,'orderid':0}}).then(function(rs){
					//--------查询购物意向表---------------------
			          sql = 'select s.id as shoppingid,g.id as goodsid,g.goodsimg,g.goodsname,s.price,s.num,g.shopid from  shoppings s,goods g where s.uid=? and s.orderid=0 and s.goodsid=g.id';
			          sequelize.query(sql,{replacements: [loginbean.id],type: sequelize.QueryTypes.QUERY}).then(function(shopList){
			          	//--------显示购物车---------------------------
			          	rsjson = JSON.parse(JSON.stringify(shopList[0]));
	          			res.render('buy/shoppingcar',{shopList:rsjson});
			          });
				})
			  }else{
			  	res.send('数据库错误,请稍后再试');
			  }
	          // res.send('创建失败');
	       })

  });
});



router.get('/createorder', function(req, res, next) {
	loginbean = req.session.loginbean;
	if(typeof(loginbean)=='undefined'){
		res.send('<script>alert("您没登陆,请登陆后操作");window.close();</script>');
		return;
	}

	orderStr = req.query.orderStr;
	orderArr = orderStr.split(',');
	len = orderArr.length;
	obj = {};
 let 	ii=1;
	for(i=1;i<len;i++){
		v = orderArr[i];
		tempArr = v.split('_');
		shopid = tempArr[0];		//商店id
		goodsid = tempArr[1];		//商品id

		if(!obj[shopid]){
			obj[shopid]=[];
		}
		

		sql = 'select shoppings.id as shoppingid,shoppings.goodsid,shoppings.price,shoppings.num,shops.id as shopid,shops.shopname,goods.id as goodsid,goods.goodsname from shoppings,goods,shops where shoppings.goodsid=? and shoppings.uid=? and shoppings.goodsid=goods.id and shoppings.shopid=shops.id and shoppings.orderid=0';
		sequelize.query(sql,{replacements: [goodsid,loginbean.id],type: sequelize.QueryTypes.QUERY}).then(function(gRs){
	      	rsjson = JSON.parse(JSON.stringify(gRs[0]));
	      	obj[shopid].push(rsjson[0]);
	      	obj[shopid].shopname=rsjson[0].shopname;
	      	ii++;
	      	if(ii==len){
	      		// console.log(obj);
	      		// for(key in obj){
	      		// 	console.log('shopid='+key);
	      		// 	console.log(obj[key]);
	      		// }
	      		res.render('buy/order',{rs:obj});
	      	}
	      	
	    });

	}
});



router.get('/addorder', function(req, res, next) {

			loginbean = req.session.loginbean;
	if(typeof(loginbean)=='undefined'){
		res.send('<script>alert("您没登陆,请登陆后操作");window.close();</script>');
		return;
	}

	shoppingids=req.query.shoppingids;
	console.log(shoppingids);
	ids = shoppingids.split(',');
	  let  len = ids.length;
 shopObj={};
  sql='select id,shopid,price,num from shoppings where id=? and uid='+loginbean.id;
  sql2="insert into  orders(total,uid,shopid) values(?,?,?)";
  sql3="update shoppings set orderid=? where id=? and uid="+loginbean.id;
  let ii=1;
 for(let  i=1;i<len;i++){
 sequelize.query(sql,{replacements: [ids[i]],type: sequelize.QueryTypes.QUERY}).then(function(sRs){
			          	//--------显示购物车---------------------------
			          	console.log(sRs);
			          	rsjson = JSON.parse(JSON.stringify(sRs[0]));

	      	 if(!shopObj[rsjson[0].shopid]){
                shopObj[rsjson[0].shopid]={};
                shopObj[rsjson[0].shopid].total=rsjson[0].price*rsjson[0].num;
                shopObj[rsjson[0].shopid].ids=[];
                shopObj[rsjson[0].shopid].ids.push(rsjson[0].id);
               
	      	}else{
	      		shopObj[rsjson[0].shopid].total+=rsjson[0].price*rsjson[0].num;
	      		      shopObj[rsjson[0].shopid].ids.push(rsjson[0].id);
	      		     
	      	}
	      	 ii++;
	      	if(ii==len){
	      
	      		for(let shopid in shopObj){
	      		  	let 	kk =1;
	      			let orders={};
	      			orders.total=shopObj[shopid].total;
	      			orders.uid=loginbean.id;
	      			console.log(shopid);
	      			orders.shopid=shopid;
	      			
	sequelize.query(sql2,{replacements: [orders.total,orders.uid,orders.shopid],type: sequelize.QueryTypes.INSERT}).then(function(oRs){
				
			          //	rsjson = JSON.parse(JSON.stringify(oRs[0]));
			          	console.log("----------------------");
			          	console.log(oRs);
			          	console.log("----------------------");
			              id=oRs;
			          //	console.log(id);
			          for(let shoppingid of  shopObj[shopid].ids){
			          	console.log(shoppingid);
			          	console.log(shopid);
sequelize.query(sql3,{replacements: [id,shoppingid]}).then(function(sRs){
	         kk ++;
		
	      	if(kk==len){
			          res.send('订单创建完成');
			          }
			         
			          })

			          }

	});
	      		}
	      	}

    })


}
});







module.exports = router;
