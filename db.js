  
    var Db = require('mongodb').Db;
    var Server = require('mongodb').Server;
    var MongoClient = require('mongodb').MongoClient;
    var db;

    var init = function(){
        MongoClient.connect("mongodb://localhost:27017/99re",(err,database)=>{
            if(err){
                console.error(err);
                return;
            }
            console.log('connect to db success');
            db = database;
        });
    }

    var insert = function(collName,data,callback){
        var coll = db.collection(collName);
        coll.save(data,(err,r)=>{
            if(!err){
                console.log('save to '+collName+' success !'); 
                if(callback){
                    callback(r);
                }
            }
            else{
                console.error(err);
            }

        });
    };

    var queryPage = function(collName,filter,skip,limit,callback){
        var coll = db.collection(collName);
        coll.find(filter).sort({videoId:1}).skip(skip).limit(limit).toArray((err,r)=>{
            if(!err){
                callback(r);
            }
            else{
                console.error(err);
                callback([]);
            }
        });
    }

    var remove = function(collName,filter,callback){
        var coll = db.collection(collName);
        coll.remove(filter,((err,r)=>{
            if(!err){
                console.log('remove to '+collName+' success !');
                if(callback){
                    callback(r);
                }
            }
            else{
                console.error(err);
            }

        }));
    }

    exports.insert = insert;
    exports.queryPage = queryPage;
    exports.remove = remove;

    exports.init = init;