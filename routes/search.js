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
 len=result['matches'].length;
	        flag=0;
			var   goodsResult=[];
  var exec=function(i){
 
  	return function(){
  		
		 	GoodsModel.findOne({where:{id:goodsid}}).then(function(rs){
		 		console.log(rs);
		    goodsResult.push(rs);
		 			flag++;
		 			if(flag==len){
		 				console.log("------------------------------------------------");
		 				console.log(goodsResult);
		 				console.log("------------------------------------------------");
		 			  res.render('search/searchGoods', {goodsResult:goodsResult});
		 			}
		 		})
		 
  	}
  }
			

	        console.log(result);
	        
	        for(var key in result['matches']){ //循环查出的id
				console.log(key+':==='+result['matches'][key].id);
				goodsid=result['matches'][key].id;
				fun=exec(goodsid);
                fun();

			}


			
			  });	
   });


router.get('/shopById', function(req, res, next) {
     
  gid=req.query.id;
sql = 'select s.* from shops s,goods g  where g.id=?  and s.id=g.shopid';
  sequelize.query(sql,{replacements: [gid]}).then(function(rs){
  	console.log("JJJJJJJJJJJJJJJJJJJJJJJ");
  	rsjson = JSON.parse(JSON.stringify(rs[0]));
      console.log(rsjson[0]);
  	
  res.send(rsjson[0]);

 });
   

});


module.exports = router;
