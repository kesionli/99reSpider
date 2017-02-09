  
    var Db = require('mongodb').Db;
    var Server = require('mongodb').Server;

    var createDb = function(){
         var db = new Db('99re',new Server('localhost',27017))
         return db;
    }

    var insert = function(collName,data){
        var db = createDb();
        db.open((err,db)=>{
            var coll = db.collection(collName);
            coll.save(data,(err,r)=>{
                if(!err){
                    console.log('save to '+collName+' success !'); 
                }
                
                db.close();
            });
        
        });
    };

    var queryPage = function(collName,filter,skip,limit,callback){
        var db = createDb();
        db.open((err,db)=>{
            var coll = db.collection(collName);
            coll.find(filter).sort({title:1}).skip(skip).limit(limit).toArray((err,r)=>{
                 if(!err){
                    callback(r);
                    //db.close();        
                }
                else{
                    console.error(err);
                    callback([]);
                }
                db.close();
            });
        
        });
    }

    exports.insert = insert;
    exports.queryPage = queryPage;