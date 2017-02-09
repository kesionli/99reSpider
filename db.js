  
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

    exports.insert = insert;