const fs = require('fs')
const path = require('path')
const download = require('download')
const request = require('sync-request')
const nameToImdb = require("name-to-imdb")
const { search, defaultProviders } = require('torrent-browse')
// const { qBittorrentClient } = require('@robertklep/qbittorrent')
// const config = require('./config');

// var MyAPIFilms_token = config.MyAPIFilms_token
// var Assrt_token = config.Assrt_token
// var qb_host = config.qb_host
// var qb_username = config.qb_username
// var qb_password = config.qb_password
// var qb_savepath = path.join(__dirname, 'videos' + config.qb_savepath);
// var qb_category = config.qb_category
// var qb_tags = config.qb_tags

// const client = new qBittorrentClient(qb_host, qb_username, qb_password);

async function getTorrents(imdbid, category) {
    if (category == 'Movie') {
        var TPB_category = 'HD - Movies'
    } else {
        var TPB_category = 'HD - TV shows'
    }
    var result = await search(defaultProviders, `${imdbid}`)
    var data = [];
    const regex = /E\d{2}/i;
    for (i in result.items) {
        if (result.items[i].data.category.name === TPB_category && !regex.test(result.items[i].data.name)) {
            data.push(result.items[i].data)
        }
    }
    return data
}

async function filter(data, quality, source, HDR) {
    if (HDR == true) {
        for (i in data) {
            if (data[i].name.search(quality) == -1 || data[i].name.search(source) == -1) {
                delete data[i];
            }
        }
    } else {
        for (i in data) {
            if (data[i].name.search(quality) == -1 || data[i].name.search(source) == -1 || data[i].name.search(/\sHDR\s/) !== -1 || data[i].name.search(/\shdr\s/) !== -1 || data[i].name.search(/\.HDR\./) !== -1 || data[i].name.search(/\.hdr\./) !== -1 || data[i].name.search(/\sHDR10\s/) !== -1 || data[i].name.search(/\shdr10\s/) !== -1 || data[i].name.search(/\.HDR10\./) !== -1 || data[i].name.search(/\.hdr10\./) !== -1) {
                delete data[i];
            }
        }
    }
    for (var i = 0; i < data.length; i++) {
        if (data[i] == null) {
            data.splice(i, 1)
            i = i - 1
        }
    }
    return data
}

async function torrentSort(a, b) {
    if (a.seeds !== b.seeds) {
        return b.seeds - a.seeds
    } else {
        if (a.peers !== b.peers) {
            return b.peers - a.peers
        } else {
            return b.size - a.size
        }
    }
}

async function downloadTorrent(client, magnet, hash, qb_savepath, qb_category, qb_tags) {
    try {
        const res = await client.torrents.add(
            {
                urls: magnet,
                savepath: qb_savepath,
                category: qb_category,
                tags: qb_tags
            }
        )
        console.log('添加下载成功！')
        fs.appendFileSync(path.join(__dirname, 'console.log'), '添加下载成功。' + '\n');
        return true
    } catch (error) {
        console.log('添加下载失败:' + error)
        fs.appendFileSync(path.join(__dirname, 'console.log'), '添加下载失败:' + error + '\n');
        return false
    }
}

async function findSub(title, year, Assrt_token) {
    title = encodeURI(title + ' ' + year)
    var res = request('GET', `https://api.assrt.net/v1/sub/search?token=${Assrt_token}&q=${title}`)
    var subs = JSON.parse(res.getBody()).sub.subs
    var sub_links = []
    for (i in subs) {
        var sub_id = subs[i].id
        try {
            var res = request('GET', `https://api.assrt.net/v1/sub/detail?token=${Assrt_token}&id=${sub_id}`)
            var sub_detail = JSON.parse(res.getBody()).sub.subs[0]
            if (sub_detail.lang.langlist.langchs) {
                for (i in sub_detail.filelist) {
                    if (sub_detail.filelist[i].f.search('cht') == -1 && sub_detail.filelist[i].f.search('CHT') == -1 && sub_detail.filelist[i].f.search('繁') == -1 && sub_detail.filelist[i].f.search('eng') == -1 && sub_detail.filelist[i].f.search('ENG') == -1 && sub_detail.filelist[i].f.search('jap') == -1 && sub_detail.filelist[i].f.search('JAP') == -1 && sub_detail.filelist[i].f.search('jpn') == -1 && sub_detail.filelist[i].f.search('JPN') == -1 && sub_detail.filelist[i].f.search('BIG5') == -1 && sub_detail.filelist[i].f.search('txt') == -1 && sub_detail.filelist[i].f.search('SP') == -1) {
                        sub_links.push(sub_detail.filelist[i])
                    }
                }
            }
        } catch (error) {
        }
    }
    return sub_links
}

async function downloadSub(sub_links, videoDir) {
    var downloadpath = videoDir;
    for (i in sub_links) {
        fs.writeFileSync(path.join(downloadpath, sub_links[i].f), await download(sub_links[i].url))
    }
}

async function searchId(title, category) {
    var type = ''
    if (category == 'Movie') {
        type = 'movie'
    } else {
        type = 'series'
    }
    return new Promise(function (resolve, reject) {
        nameToImdb({ name: title, type: type, providers: ['metadata'] }, function (err, res, inf) {
            if (err) {
                reject(err);
            } else {
                resolve(res);
            }
        });
    });
}

async function matchTMDB(imdbid, category, MyAPIFilms_token) {
    if (category == 'Movie') {
        var res = request('GET', `https://www.myapifilms.com/tmdb/movieInfoImdb?idIMDB=${imdbid}&token=${MyAPIFilms_token}&format=json&language=zh&alternativeTitles=0&credits=1&images=0&keywords=0&releases=0&videos=0&translations=0&similar=0&reviews=0&lists=0`);
        var info = JSON.parse(res.getBody()).data
    } else {
        var res = request('GET', `https://www.myapifilms.com/tmdb/find?id=${imdbid}&token=${MyAPIFilms_token}&externalSource=imdb_id&format=json&language=zh`);
        var tmdbid = JSON.parse(res.getBody()).data.tv_results[0].id;
        var secondRes = request('GET', `https://www.myapifilms.com/tmdb/tv?idTmdb=${tmdbid}&token=${MyAPIFilms_token}&format=json&language=zh&alternativeTitles=0&changes=0&contentRatings=0&credits=1&externalIds=1&images=0&keywords=0&similar=0&translations=0&videos=0`);
        var info = JSON.parse(secondRes.getBody()).data
    }
    return info
}

module.exports = {
    getTorrents,
    matchTMDB,
    filter,
    torrentSort,
    downloadTorrent,
    downloadSub,
    findSub,
    searchId
};