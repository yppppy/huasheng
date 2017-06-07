var Sequelize = require('sequelize'); 
var sequelize =require('./ModelHeader')();

var OrderModel = sequelize.define('orders', {
    id: {type:Sequelize.BIGINT,primaryKey: true},
    total: Sequelize.DECIMAL,
           uid: Sequelize.BIGINT,
    shopid:Sequelize.BIGINT,
          createtime:Sequelize.DATE,
    state: Sequelize.BIGINT
},{
        timestamps: false,
        //paranoid: true  //获取不到id的返回值
    });

module.exports = OrderModel;
