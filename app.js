var spider = require('./spider');
var db = require('./db');
var http = require('http');
var fs = require('fs');
var qs = require('querystring')
var url = require('url');
//spider.run(1,1727);

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

        if(qsObj.spider=='all'){
            //to get all 99re vedios 
            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('删除所有数据，重新爬取所有数据，大概要1天半左右。。。Σ( ° △ °|||)︴');
            res.end();
        }
        else if(qsObj.spider=='last'){
            //to get last 10 pages videos
            spider.run(1,10);
            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('重新爬取前10页数据，大概要半小时。。。Σ( ° △ °|||)︴');
            res.end();
        }
        else{
            res.writeHead(200,{'Content-Type':'text/html'});  
            res.write('error paramater .');
            res.end();
        }

     
    }
    else{
        res.writeHead(404,{'Content-Type':'text/html'});  
        res.write('not find page');
        res.end();
    }
   
});  
  
server.listen(3000);  
console.log('http server started...port:3000');