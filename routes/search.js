var express = require('express');
var router = express.Router();
SphinxClient = require ("sphinxapi");
var GoodsModel = require('../models/GoodsModel');
var sequelize =require('../models/ModelHeader')();
/* GET home page. */
router.get('/goods', function(req, res, next) {
 
console.log('访问goods');
  //res.locals.loginbean = req.session.loginbean;
  keywords = req.query.keywords;
  kwArr = keywords.split(' ');
  len = kwArr.length;
  keyword = '';
  for(i=0;i<len;i++){
  	if(kwArr[i]!=''){
  		keyword += kwArr[i]+'|';
  	}
  }
  var cl = new SphinxClient();
  cl.SetServer('localhost', 9312);
  cl.SetMatchMode(SphinxClient.SPH_MATCH_ANY);		//或运算
  cl.Query(keyword,'goods',function(err, result) {
	        if(err){
	        	console.log(err);
	        	console.log('-------有错-----------');
	        	res.send(err);
	        	return;
	        }

  total = result.total;

	        sql = 'select s.id as shopid,g.id as goodsid,s.shopname,s.lng,s.lat,g.goodsname,g.goodsimg,g.goodsintro,g.price,g.praise from goods g,shops s where g.id=? and g.shopid=s.id';
	        rsGoods=[];
	        ii=0;
  var exec=function(i){
 
  	return function(){
  		sequelize.query(sql,{replacements: [goodsid],type: sequelize.QueryTypes.QUERY}).then(function(rs){
				 	rsjson = JSON.parse(JSON.stringify(rs[0]));
				 	rsGoods.push(rsjson[0]);
				 	ii++;
				 	if(ii>=total){
				 		res.locals.loginbean = req.session.loginbean;

				 		res.render('search/searchGoods',{rsGoods:rsGoods,keywords:keywords});
				 	}
				 })
  		
		 	// GoodsModel.findOne({where:{id:goodsid}}).then(function(rs){
		 	// 	console.log(rs);
		  //   goodsResult.push(rs);
		 	// 		flag++;
		 	// 		if(flag==len){
		 	// 			console.log("------------------------------------------------");
		 	// 			console.log(goodsResult);
		 	// 			console.log("------------------------------------------------");
		 	// 		  res.render('search/searchGoods', {goodsResult:goodsResult});
		 	// 		}
		 	// 	})
		 
  	}
  }
			

	     
	        
	        for(var key in result['matches']){ //循环查出的id
				console.log(key+':==='+result['matches'][key].id);
				goodsid=result['matches'][key].id;
				fun=exec(goodsid);
                fun();

			}


			
			  });	
   });


router.get('/goodsById', function(req, res, next) {
     
  gid=req.query.goodsid;
  
GoodsModel.findOne({where:{id:gid}}).then(function(goods){
  console.log(goods);
  res.render('search/goodsinfo', {rs:goods});

  
             });
   

});


module.exports = router;
