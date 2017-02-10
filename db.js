  
    var Db = require('mongodb').Db;
    var Server = require('mongodb').Server;

    var createDb = function(){
         var db = new Db('99re',new Server('localhost',27017))
         return db;
    }

    var insert = function(collName,data,callback){
        createDb().open((err,db)=>{
            var coll = db.collection(collName);
            coll.save(data,(err,r)=>{
                if(!err){
                    console.log('save to '+collName+' success !'); 
                }
                if(callback){
                    callback(r);
                }
                db.close();
            });
        
        });
    };

    var queryPage = function(collName,filter,skip,limit,callback){
        createDb().open((err,db)=>{
            var coll = db.collection(collName);
            coll.find(filter).sort({title:1}).skip(skip).limit(limit).toArray((err,r)=>{
                 if(!err){
                    callback(r);
                }
                else{
                    console.error(err);
                    callback([]);
                }
                db.close();
            });
        
        });
    }

    var remove = function(collName,filter,callback){
         createDb().open((err,db)=>{
            var coll = db.collection(collName);
            coll.remove(filter,((err,r)=>{
                 if(!err){
                    console.log('remove to '+collName+' success !'); 
                }
                if(callback){
                    callback(r);
                }
                db.close();
            }));
        
        });

    }

    exports.insert = insert;
    exports.queryPage = queryPage;
    exports.remove = remove;