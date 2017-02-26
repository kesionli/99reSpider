var spider = require('./spider');
var db = require('./db');
var http = require('http');
var fs = require('fs');
var qs = require('querystring')
var url = require('url');
var request = require('request');
var conf = require('./conf').conf;

db.init();

var server=new http.Server();  
server.on('request',function(req,res){  
    if(req.url==='/'){
        // return html;
        res.writeHead(200,{'Content-Type':'text/html'});  
        
        fs.readFile('./index.html','utf8',(err,data)=>{
            if (err) {
                throw err;
            }
            res.write(data);
            res.end();
        });
    }
    else if(req.url.indexOf('/q')>=0){
        //ajax page data
        var qsObj = url.parse(req.url,true).query;
        res.writeHead(200,{'Content-Type':'application/json'});  
        var skip=0;
        var limit = 24;

        if(qsObj.p==0){
            skip = 0*limit;
        }
        else{
            skip = (parseInt(qsObj.p)-1)*limit;
        }

        db.queryPage('pages',{},skip,limit,(rows)=>{
            var json = JSON.stringify(rows);
            res.write(json);
            res.end();
        });

    }
    else if(req.url.indexOf('/c')>=0){
        //console spider
        var qsObj = url.parse(req.url,true).query;

        var down = qsObj.down;
        var proxy = qsObj.proxy;
        if(down==='true'){
            conf.download = true;
        }
        if(proxy==='true'){
            conf.proxy = true;
        }

        if(qsObj.spider=='all'){
            //to get all 99re vedios 
             db.remove('pages',{},(r)=>{
                spider.run(1);
            });
            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('删除所有数据，重新爬取所有数据，要好久好久。。。Σ( ° △ °|||)︴');
            res.end();
        }
        else if(qsObj.spider=='last'){
            //to get last 10 pages videos
            db.remove('pages',{},(r)=>{
                spider.run(1,10);
            });
            
            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('删除所有数据，重新爬取前10页数据，大概要半小时。。。Σ( ° △ °|||)︴');
            res.end();
        }
        else if(qsObj.spider=='redown'){
            db.find('pages',{videoUrl:{$ne:''}},(rows)=>{
                spider.downloadVideoList(0,rows);
            });

            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('重新下载所有视频。。。');
            res.end();
        }
        else{
            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('error paramater .');
            res.end();
        }
    }
    else if(req.url.indexOf('/v')>=0){
        var qsObj = url.parse(req.url,true).query;
        var id = qsObj.id;
        var videoName = './' + id + '.mp4';
        fs.exists(videoName,(exists)=>{
            if(exists){
                fs.createReadStream(videoName).pipe(res);      
            }
            else{
                res.writeHead(404,{'Content-Type':'text/html'});  
                res.write('Not find');
                res.end();
            }
        });
    }
    else{
        res.writeHead(404,{'Content-Type':'text/html'});  
        res.write('Not find');
        res.end();
    }
   
});  
  
server.listen(3456);  
console.log('http server started...port:3456');