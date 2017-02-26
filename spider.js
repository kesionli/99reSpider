var Agent = require('socks5-http-client/lib/Agent');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var db = require('./db');
var conf = require('./conf').conf;

var getMaxPageIndex = function(callback){
    var url ='http://99re.com/?mode=async&action=get_block&block_id=list_videos_most_views&dir=&from2=1';
     socksGet(url,(res)=>{
        var $ = cheerio.load(res.body);
        var maxPageIndex = $('.more-thumbs.btn.btn-more').data('total');
        callback(maxPageIndex);
        console.log('max page index is '+ maxPageIndex );
    },(err)=>{
        console.error('get max page index error .');
    });
}

var getData= function(pageIndex,maxPageIndex){
    if(maxPageIndex===undefined){
        // if not input maxPageIndex , try to get maxPageIndex from web .
        getMaxPageIndex((max)=>{
            getData(pageIndex,max);
        });
        return;
    }

    if(pageIndex>maxPageIndex){
        console.log('get all data complete .');
        return;
    }
    console.log('start to get page '+pageIndex);
    var url ='http://www.99re.com/latest-updates/'+pageIndex+'/';
    socksGet(url,(res)=>{
        selectVideoData(res.body,()=>{
            console.log('get page data '+pageIndex+' success .');
            getData(pageIndex+1,maxPageIndex);
        });
      
    },(err)=>{
        console.error('get page '+pageIndex+' error ,go to next page .');
        getData(pageIndex+1,maxPageIndex);
    });

}

var selectVideoData=function(html,complete){
    var $ = cheerio.load(html);

    var thumbs = $('.thumb-content').toArray();

    var pages = [];

    thumbs.forEach((t)=>{
        var a = $(t).find('a');
        var img = $(t).find('img');

        var href =$(a).attr('href');
        var title =$(a).attr('title');
        var screenShotSrc = $(img).attr('src');
        var videoId = getVideoId(screenShotSrc);
        pages.push({
                href:href,
                title:title,
                imgSrc:screenShotSrc,
                videoUrl:'',
                videoId:videoId
        });

     
    });

    var index = 0 ;
    getVideoUrl(index,pages,complete);
   
}

var getVideoUrl = function(index,pages,complete){
    if(index>=pages.length){
        complete();
        return;
    }

      //try to get video url
      var page = pages[index];
        socksGet(page.href,(res)=>{
            var html = res.body;
            var videoUrl = '';
            var startIndex = html.indexOf('video_url: \'');
            if(startIndex>=0){
                var subHtml = html.substring(startIndex+12);
                var endIndex = subHtml.indexOf('/\',');

                 videoUrl = subHtml.substring(0,endIndex);
            }
            else{
                console.log('can not find video url by page '+page.href+' may private video .');
            }
            page.videoUrl =  videoUrl;
            if(page.videoUrl){
                var videoFileName = page.videoId+'.mp4';
                console.log('try to download video '+videoFileName);
                fs.exists(videoFileName,(exists)=>{
                    if(!exists){
                        downloadVideo(videoUrl,videoFileName);
                    }
                    else{
                        console.log(videoFileName +' is exists ');
                    }
                });
            }
         
            console.log(page.href);
            console.log(page.title);
            console.log(page.imgSrc);
            console.log(page.videoUrl);
            db.insert('pages',page);
           var nextIndex = index+1;
            getVideoUrl(nextIndex,pages,complete);
        },(err)=>{
            console.log(page.href);
            console.log(page.title);
            console.log(page.imgSrc);
            console.log(page.videoUrl);
            db.insert('pages',page);
            var nextIndex = index+1;
            getVideoUrl(nextIndex,pages,complete);;
        });
}

var downloadVideo=function(videoUrl,videoName,complete,tryTimes){
    if(!conf.download){
        return;
    }
    if(tryTimes === undefined){
        tryTimes = 3;
    }
    if(tryTimes == 0){
        if(complete){
            complete();
        }
        return;
    }
    var r = request({
                        url: videoUrl,
                        timeout:30000
                    }).on('error',(err)=>{
                        console.log('download video '+videoName+' error .');
                        console.error(err);
                        downloadVideo(videoUrl,videoName,complete,tryTimes-1);
                    }).on('response',(resp)=>{
                       if(resp.statusCode===200){
                            r.pipe(fs.createWriteStream(videoName)).on('finish',  ()=> {
                                console.log('download video '+videoName+' finish .');
                            });
                       }
                       if(complete){
                            complete();
                        }
                    });
}

var downloadVideoList = function(index,pages){
    if(index>=pages.length){
        console.log('downloadVideoList complete');
        return;
    }

    var page = pages[index];
    var fileName = page.videoId+'.mp4';
    var videoUrl = page.videoUrl;

    downloadVideo(videoUrl,fileName,()=>{
        downloadVideoList(index+1,pages);
    });
    
}

var getVideoId = function(url){
    var arr = url.split('/');
    return arr[arr.length-3];
}

var socksGet=function(url,callback,errCallback,trytimes){
    if(trytimes===undefined){
        trytimes = 3;
    }
    var op = {
        url:url,
        timeout:30000
    };
    if(conf.proxy){
        op.agentClass=Agent;
        op.agentOptions={
            socksHost:'127.0.0.1',
            socksPort:1080
        };
    }
    request(op, function(err, res) {
        if(err){
            console.error('request '+url+' error .');
            console.error(err);
            if(trytimes>0){
                socksGet(url,callback,errCallback,trytimes-1);
            }
            else{
                if(errCallback){
                    errCallback(err);
                }
            }
        }
        else {
            callback(res);
        }
      
    });
}

exports.downloadVideoList = downloadVideoList;
exports.run = getData;
