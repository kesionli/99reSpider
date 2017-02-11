var Agent = require('socks5-http-client/lib/Agent');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var db = require('./db');
var sleepTime=1000;
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    var url ='http://99re.com/?mode=async&action=get_block&block_id=list_videos_most_views&dir=&from2='+pageIndex;
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
    getVideoUrl(index,pages,()=>{
        complete();
    });
   
}

var getVideoUrl = function(index,pages,complete){
    if(index>=pages.length){
        complete();
        return;
    }

      //try to get video url
      var page = pages[index];
        socksGet(page.href,(res)=>{
            console.log(res.body);
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
                var r = request({
                        url: page.videoUrl
                    }).on('error',()=>{
                        console.log('download video error .');
                    }).on('response',(resp)=>{
                       if(resp.statusCode===200){
                            r.pipe(fs.createWriteStream(videoFileName)).on('finish',  ()=> {
                                console.log('download video '+videoFileName+' finish .');
                            });
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

var getVideoId = function(url){
    var arr = url.split('/');
    return arr[arr.length-3];
}

var socksGet=function(url,callback,errCallback){
    request({
        url: url,
        timeout:30000,
        agentClass: Agent,
        agentOptions: {
            socksHost: '127.0.0.1', // Defaults to 'localhost'.
            socksPort: 1080 // Defaults to 1080.
        }
    }, function(err, res) {
        if(err){
            console.error(err);
            if(errCallback){
                errCallback(err);
            }
        }
        else if(res.body){
            callback(res);
        }
      
    });
}


exports.run = getData;
