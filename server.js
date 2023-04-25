const express = require('express');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const functions = require('./functions');

const app = express();
const CONFIG_FILE = 'config.json';
const config = JSON.parse(fs.readFileSync(CONFIG_FILE));
const osPlatform = process.platform;
const videoPath = './videos';

var MyAPIFilms_token = config.MyAPIFilms_token;
var assrt_token = config.assrt_token;
var qb_host = config.qb_host;
var qb_username = config.qb_username;
var qb_password = config.qb_password;
var qb_savepath = path.join(__dirname, 'videos', config.qb_savepath);
var qb_category = config.qb_category;
var qb_tags = config.qb_tags;
var open_command = '';
var info = {};
var searchList = [];

// 判断系统平台
if (osPlatform === "win32") {
   open_command = 'start ""';
} else if (osPlatform === "darwin") {
   open_command = 'open';
} else if (osPlatform === "linux") {
   open_command = 'xdg-open';
}

// 启动时清空日志
fs.truncateSync(path.join(__dirname, 'console.log'), 0);

app.use(express.static('public'));
app.use(express.json());

// 首页
app.get('/', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'html', 'index.html'));
});

// 设置页
app.get('/config', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'html', 'config.html'));
});

// 搜索页
app.get('/search', (req, res) => {
   res.sendFile(path.join(__dirname, 'public', 'html', 'search.html'));
});

// 保存设置
app.post('/save-config', (req, res) => {
   const data = req.body;
   fs.writeFile(CONFIG_FILE, JSON.stringify(data), (error) => {
      if (error) throw error;
      console.log('设置保存成功！');
      res.send('设置保存成功！');
   });
});

// 加载设置
app.get('/load-config', (req, res) => {
   fs.readFile(CONFIG_FILE, (error, data) => {
      if (error) {
         if (error.code === 'ENOENT') {
            res.json({});
            return;
         }
         throw error;
      }
      const jsonData = JSON.parse(data);
      res.json(jsonData);
   });
});

// 搜索
app.post('/search-data', async (req, res) => {
   var title = req.body.title;
   var year = req.body.year;
   var savepath = req.body.savepath;
   var category = req.body.category;
   var quality = req.body.quality;
   var source = req.body.source;
   var HDR = req.body.HDR === 'true';
   if (!searchList.includes(title)) {
      console.log('搜索开始。');
      fs.writeFileSync(path.join(__dirname, 'console.log'), '搜索开始。' + '\n');
      await searchList.push(title);
      await main(title, year, savepath, category, quality, source, HDR);
      await searchList.splice(searchList.indexOf(title), 1);
      res.send('搜索完毕');
   } else {
      console.log('已在搜索队列中，请勿重复搜索。')
      fs.appendFileSync(path.join(__dirname, 'console.log'), '已在搜索队列中，请勿重复搜索。' + '\n');
      res.send('重复搜索');
   }
});

// 获取日志
app.get('/log', function (req, res) {
   var data = fs.readFileSync(path.join(__dirname, 'console.log'), 'utf-8');
   res.send(data);
});

// 媒体库页
app.get('/library/:name', function (req, res) {
   var libraryData = fs.readFileSync('./library.json');
   var library = JSON.parse(libraryData);
   var name = req.params.name;
   if (library[name]) {
      var HTML = fs.readFileSync(path.join(__dirname, 'public', 'html', 'library.html'), 'utf-8');
      const $ = cheerio.load(HTML);
      $('title').text('Cinematrix - ' + name);
      $('.content h1').text(`${name}`);
      res.send($.html());
   } else {
      res.sendStatus(404);
   }
});

// 详情页
app.get('/detail/:title', function (req, res) {
   var data = fs.readFileSync('./library.json');
   data = JSON.parse(data);
   var title = req.params.title;
   for (i in data) {
      for (j in data[i].videos) {
         if (data[i].videos[j].title === title) {
            var HTML = fs.readFileSync(path.join(__dirname, 'public', 'html', 'detail.html'), 'utf-8');
            const $ = cheerio.load(HTML);
            $('title').text('Cinematrix - ' + title);
            res.send($.html());
            return;
         }
      }
   }
   res.sendStatus(404);
});

// 更新侧边栏
app.get('/sidebar', (req, res) => {
   try {
      var libraryData = fs.readFileSync('./library.json');
      var library = JSON.parse(libraryData);
      res.json(library);
   } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
   }
});

// 更新媒体库
app.post('/create-library', async (req, res) => {
   try {
      var libraryData = fs.readFileSync('./library.json');
      var library = JSON.parse(libraryData);
      var value = req.body.data.split(':');
      var name = value[0];
      var libraryPath = value[1];
      libraryPath = libraryPath.replace(/\:/g, '').replace(/\?/g, '').replace(/\</g, '').replace(/\>/g, '').replace(/\*/g, '').replace(/\|/g, '').replace(/\"/g, '');
      library[name] = {
         path: libraryPath,
         videos: []
      };
      const dir = path.join(__dirname, 'videos', libraryPath);
      try {
         fs.mkdirSync(dir);
      } catch (error) {
      }
      await traverseDir(dir, library[name].videos);
      fs.writeFileSync('./library.json', JSON.stringify(library));
      res.sendStatus(200);
   } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
   }
});

// 删除媒体库
app.post('/delete-library', (req, res) => {
   try {
      var libraryData = fs.readFileSync('./library.json');
      var library = JSON.parse(libraryData);
      var name = req.body.name;
      delete library[name];
      fs.writeFileSync('./library.json', JSON.stringify(library));
      res.sendStatus(200);
   } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
   }
})

// 打开视频
app.get('/open-video', (req, res) => {
   const title = req.query.title;
   const filePath = matchMetadata(videoPath, title);
   if (filePath !== undefined) {
      const metadata = JSON.parse(fs.readFileSync(path.join(__dirname, filePath)));
      if (metadata.src && metadata.src.length !== 0) {
         const videoPath = metadata.src[0];
         exec(`${open_command} "${videoPath}"`, (error) => {
            if (error) {
               console.error(`exec error: ${error}`);
               res.status(500).send('打开视频失败：' + error);
               return;
            }
            res.send('打开视频成功！');
         });
      } else {
         res.status(500).send('视频不存在!');
      }
   } else {
      res.status(500).send('视频不存在!');
   }
});

// 发送tmdb数据
app.get('/tmdb-info', (req, res) => {
   const title = req.query.title;
   const metadata = matchMetadata(videoPath, title);
   if (metadata !== undefined) {
      // 读取metadata.json文件
      fs.readFile(path.join(__dirname, metadata), (error, data) => {
         if (error) throw error;
         // 将文件内容转换为JSON格式
         const jsonData = JSON.parse(data);
         // 发送JSON数据到前端
         res.send(jsonData);
      });
   } else {
      res.sendStatus(404);
   }
});

// 发送媒体库数据
app.get('/library-data', (req, res) => {
   // 读取data.json文件
   fs.readFile('library.json', (error, data) => {
      if (error) throw error;
      // 将文件内容转换为JSON格式
      const jsonData = JSON.parse(data);
      // 发送JSON数据到前端
      res.send(jsonData);
   });
});

// 获取数据函数
async function getData(title, year, category, quality, source, HDR) {
   try {
      var imdbid = await functions.searchId(title, category);
      console.log('获取IMDBID：' + imdbid);
      fs.appendFileSync(path.join(__dirname, 'console.log'), '获取IMDBID：' + imdbid + '\n');
      if (imdbid !== undefined) {
         try {
            info = await functions.matchTMDB(imdbid, category, MyAPIFilms_token);
            if (info.title) {
               var name = info.title;
               year = info.release_date.split('-')[0] || year;
               console.log('获取TMDB信息成功！');
               fs.appendFileSync(path.join(__dirname, 'console.log'), '获取TMDB信息成功！' + '\n');
               console.log('获取名称：' + name + ' (' + year + ')');
               fs.appendFileSync(path.join(__dirname, 'console.log'), '获取名称：' + name + ' (' + year + ')' + '\n');
            } else if (info.name) {
               var name = info.name;
               year = info.first_air_date.split('-')[0] || year;
               console.log('获取TMDB信息成功！');
               fs.appendFileSync(path.join(__dirname, 'console.log'), '获取TMDB信息成功！' + '\n');
               console.log('获取名称：' + name + ' (' + year + ')');
               fs.appendFileSync(path.join(__dirname, 'console.log'), '获取名称：' + name + ' (' + year + ')' + '\n');
            } else {
               throw new Error('未找到TMDB信息。');
            }
         } catch (error) {
            console.log('获取TMDB信息失败：' + error);
            fs.appendFileSync(path.join(__dirname, 'console.log'), '获取TMDB信息失败：' + error + '\n');
         }
         try {
            console.log('开始搜索资源...');
            fs.appendFileSync(path.join(__dirname, 'console.log'), '开始搜索资源...' + '\n');
            var torrentsData = await functions.getTorrents(imdbid, category);
            var torrentsNumber = Object.keys(torrentsData).length;
            if (torrentsNumber !== 0) {
               console.log('搜索资源完毕');
               fs.appendFileSync(path.join(__dirname, 'console.log'), '搜索资源完毕' + '\n');
               try {
                  console.log('开始筛选资源...');
                  fs.appendFileSync(path.join(__dirname, 'console.log'), '开始筛选资源...' + '\n');
                  var data = await functions.filter(torrentsData, quality, source, HDR);
                  var filterNumber = Object.keys(data).length;
                  if (filterNumber !== 0) {
                     console.log('筛选资源完毕');
                     fs.appendFileSync(path.join(__dirname, 'console.log'), '筛选资源完毕' + '\n');
                     try {
                        console.log('开始资源排序...');
                        fs.appendFileSync(path.join(__dirname, 'console.log'), '开始资源排序...' + '\n');
                        await data.sort(functions.torrentSort);
                        console.log('资源排序完毕');
                        fs.appendFileSync(path.join(__dirname, 'console.log'), '资源排序完毕' + '\n');
                        try {
                           var number = Object.keys(data).length;
                           console.log(`获取数据成功！共${number}个资源`);
                           fs.appendFileSync(path.join(__dirname, 'console.log'), `获取数据成功！共${number}个资源` + '\n');
                           return data;
                        } catch (error) {
                           console.log('获取数据失败！');
                           fs.appendFileSync(path.join(__dirname, 'console.log'), `获取数据失败！` + '\n');
                        }
                     } catch (error) {
                        console.log('资源排序失败：' + error);
                        fs.appendFileSync(path.join(__dirname, 'console.log'), '资源排序失败：' + error + '\n');
                     }
                  } else {
                     throw new Error('没有符合条件的资源。');
                  }
               } catch (error) {
                  console.log('筛选资源失败：' + error);
                  fs.appendFileSync(path.join(__dirname, 'console.log'), '筛选资源失败：' + error + '\n');
               }
            } else {
               throw new Error('未找到资源。');
            }
         } catch (error) {
            console.log('获取资源失败：' + error);
            fs.appendFileSync(path.join(__dirname, 'console.log'), '获取资源失败：' + error + '\n');
         }
      } else {
         throw new Error('未找到IMDBID。');;
      }
   } catch (error) {
      console.log('获取资源失败：' + error);
      fs.appendFileSync(path.join(__dirname, 'console.log'), '获取资源失败：' + error + '\n');
      console.log('请检查输入的搜索条件是否有误。');
      fs.appendFileSync(path.join(__dirname, 'console.log'), '请检查输入的搜索条件是否有误。' + '\n');
   }
}

function readMetadata(dirPath) {
   const metadataFilePath = path.join(dirPath, 'metadata.json');
   if (fs.existsSync(metadataFilePath)) {
      const metadata = fs.readFileSync(metadataFilePath, 'utf8');
      return JSON.parse(metadata);
   }
   return null;
}

async function traverseDir(dirPath, videos) {
   const files = fs.readdirSync(dirPath);
   for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
         traverseDir(filePath);
         const metadata = readMetadata(filePath);
         if (metadata) {
            videos.push({
               title: metadata.title,
               poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2' + metadata.poster_path,
               path: [
                  metadata.src
               ]
            });
         }
      }
   }
}

async function main(title, year, savepath, category, quality, source, HDR,) {
   try {
      var data = await getData(title, year, category, quality, source, HDR);
      var magnet = data[0].magnet
      var hash = magnet.slice(20, 60)
      try {
         console.log('添加下载：' + hash)
         fs.appendFileSync(path.join(__dirname, 'console.log'), '添加下载：' + hash + '\n');
         var qbSavepath = qb_savepath;
         if (savepath != '') {
            qbSavepath = path.join(__dirname, 'videos', savepath);
         }
         if (category === '') {
            category = qb_category;
         }
         var downloadState = await functions.downloadTorrent(magnet, hash, qbSavepath, category, qb_tags);
         if (downloadState) {
            try {
               console.log('储存削挂信息中...')
               fs.appendFileSync(path.join(__dirname, 'console.log'), '储存削挂信息中...' + '\n');
               var dirPath = '';
               const watcher = fs.watch(qbSavepath, async (eventType, filename) => {
                  if (eventType === 'rename' && fs.statSync(qbSavepath + '/' + filename).isDirectory()) {
                     dirPath = path.join(qbSavepath, filename);
                     const watcher1 = fs.watch(dirPath, async (eventType, filename) => {
                        if (eventType === 'change' && fs.statSync(dirPath + '/' + filename).isFile() && (filename.indexOf('.mkv') != -1 || filename.indexOf('.mp4') != -1) && filename.indexOf('sample') == -1) {
                           info.src = [];
                           var dir = dirPath
                           const files = fs.readdirSync(dir);
                           for (const file of files) {
                              const filePath = path.join(dir, file);
                              const stat = fs.statSync(filePath);
                              if (!stat.isDirectory() && (file.indexOf('.mkv') != -1 || file.indexOf('.mp4') != -1) && file.indexOf('sample') == -1) {
                                 info.src.push(filePath);
                              }
                           }
                           fs.writeFileSync(path.join(dirPath, 'metadata.json'), JSON.stringify(info));
                           var tempData = fs.readFileSync('./library.json');
                           var videoData = JSON.parse(tempData);
                           if (info.title) {
                              var videoTitle = info.title
                           } else {
                              var videoTitle = info.name
                           }
                           for (i in videoData) {
                              if (videoData[i].path.includes(qbSavepath.split('videos')[1].replace(/\\/g, '/'))) {
                                 var videoExist = 0
                                 for (j in videoData[i].videos) {
                                    if (videoData[i].videos[j].title == videoTitle) {
                                       if (!videoData[i].videos[j].path.includes(dirPath)) {
                                          videoData[i].videos[j].path.push(dirPath);
                                       }
                                       videoExist = 1
                                       break
                                    }
                                 }
                                 if (videoExist == 0) {
                                    videoData[i].videos.push({
                                       title: videoTitle,
                                       poster: 'https://image.tmdb.org/t/p/w600_and_h900_bestv2' + info.poster_path,
                                       path: dirPath
                                    });
                                 }
                                 fs.writeFileSync('./library.json', JSON.stringify(videoData));
                                 console.log('削挂信息储存成功！');
                                 fs.appendFileSync(path.join(__dirname, 'console.log'), '削挂信息储存成功！' + '\n');
                                 break;
                              }
                           }
                           watcher1.close(); // 停止监视
                        }
                     });
                     try {
                        console.log('开始搜索字幕...')
                        fs.appendFileSync(path.join(__dirname, 'console.log'), '开始搜索字幕...' + '\n');
                        var sub_links = await functions.findSub(title, year, assrt_token);
                        if (sub_links.length == 0) {
                           throw new Error('没有找到字幕。')
                        }
                        console.log('搜索字幕成功！')
                        fs.appendFileSync(path.join(__dirname, 'console.log'), '搜索字幕成功！' + '\n');
                        try {
                           console.log('开始下载字幕...')
                           fs.appendFileSync(path.join(__dirname, 'console.log'), '开始下载字幕...' + '\n');
                           await functions.downloadSub(sub_links, dirPath);
                           console.log('下载字幕成功！')
                           fs.appendFileSync(path.join(__dirname, 'console.log'), '下载字幕成功！' + '\n');
                        } catch (error) {
                           console.log('下载字幕失败：' + error)
                           fs.appendFileSync(path.join(__dirname, 'console.log'), '搜索字幕失败：' + error + '\n');
                        }
                     } catch (error) {
                        console.log('搜索字幕失败：' + error)
                        fs.appendFileSync(path.join(__dirname, 'console.log'), '搜索字幕失败：' + error + '\n');
                     }
                     watcher.close(); // 停止监视
                  }
               });
            } catch (error) {
               console.log('削挂信息储存失败：' + error);
               fs.appendFileSync(path.join(__dirname, 'console.log'), '削挂信息储存失败：' + error + '\n');
            }
         }
      } catch (error) {
         console.log('添加下载失败：' + error + hash)
         fs.appendFileSync(path.join(__dirname, 'console.log'), '添加下载失败：' + error + '\n');
      }
   } catch (error) {
   }
}

// 递归函数，用于遍历目录检索metadata
function matchMetadata(dir, title) {
   const files = fs.readdirSync(dir);
   for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
         const match = matchMetadata(filePath, title);
         if (match !== undefined) {
            return match;
         }
      } else if (file === 'metadata.json') {
         const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
         if (metadata.title === title || metadata.name === title) {
            return filePath;
         }
      }
   }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
   console.log(`服务运行在：http://localhost:${port}`);
});