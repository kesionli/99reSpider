var Agent = require('socks5-http-client/lib/Agent');
var request = require('request');
var cheerio = require('cheerio');
var db = require('./db');

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

var getData= function(pageIndex,maxPageIndex){

    if(pageIndex>maxPageIndex){
        return;
    }
    console.log('start to get page '+pageIndex);
    var url ='http://99re.com/?mode=async&action=get_block&block_id=list_videos_most_views&dir=&from2='+pageIndex;
    socksGet(url,(res)=>{
        selectVideoData(res.body,()=>{
            console.log('get page data '+pageIndex+' success .');
            sleep(5000).then(()=>{
                getData(pageIndex+1,maxPageIndex);
            });
        });
      
    },(err)=>{
        console.error('get page '+pageIndex+' error ,go to next page .');
        sleep(5000).then(()=>{
             getData(pageIndex+1,maxPageIndex);
        });
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

        pages.push({
                href:href,
                title:title,
                imgSrc:screenShotSrc,
                videoUrl:''
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
            console.log(page.href);
            console.log(page.title);
            console.log(page.imgSrc);
            console.log(page.videoUrl);
            db.insert('pages',page);
            sleep(5000).then(()=>{
                var nextIndex = index+1;
                getVideoUrl(nextIndex,pages,complete);
            });
        },(err)=>{
            console.log(page.href);
            console.log(page.title);
            console.log(page.imgSrc);
            console.log(page.videoUrl);
            db.insert('pages',page);
            sleep(5000).then(()=>{
                var nextIndex = index+1;
                getVideoUrl(nextIndex,pages,complete);
            });
        });
}

var socksGet=function(url,callback,errCallback){
    request({
        url: url,
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
