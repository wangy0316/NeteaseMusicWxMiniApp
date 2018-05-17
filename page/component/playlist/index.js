var app = getApp();
var bsurl = require('../../../utils/bsurl.js');
var id2Url = require('../../../utils/base64md5.js');
var nt = require("../../../utils/nt.js")
var common = require('../../../utils/util.js');
Page({
  data: {
    list: [],
    curplay: {},
    pid: 0,
    cover: '',
    music: {},
    playing: false,
    playtype: 1,
    loading: true,
    toplist: false,
    user: wx.getStorageSync('user') || {}
  },
  toggleplay: function () {
    common.toggleplay(this, app);
  },
  playnext: function (e) {
    app.nextplay(e.currentTarget.dataset.pt)
  },
  music_next: function (r) {
    this.setData({
      music: r.music,
      playtype: r.playtype,
      curplay: r.music.id
    })
  },
  music_toggle: function (r) {
    this.setData({
      playing: r.playing,
      music: r.music,
      playtype: r.playtype,
      curplay: r.music.id
    })
  },
  onShow: function () {
    nt.addNotification("music_next", this.music_next, this);
    nt.addNotification("music_toggle", this.music_toggle, this);
    this.setData({
      curplay: app.globalData.curplay.id,
      music: app.globalData.curplay,
      playing: app.globalData.playing,
      playtype: app.globalData.playtype
    })
  },
  onHide: function () {
    nt.removeNotification("music_next", this)
    nt.removeNotification("music_toggle", this)
  },
  lovesong:function(){
    common.songheart(this,app, 0,(this.data.playtype==1? this.data.music.st:this.data.music.starred));
  },
  onLoad: function (options) {
    var that = this
    console.log('pid:' + options.pid)
    console.log('br:' + options.from)
    // 上面两个是navigation传过来的值
    wx.request({
      url: bsurl + 'playlist/detail',  //这个路径什么都没有
      data: {
        id: options.pid, 
        // 每个点击链接跳转到这里的pid都不是同一个值，这个id号有什么用？将传递过来的值赋给id
        limit: 1000
      },
      success: function (res) {
        console.log('pid:'+ res.data)
        var canplay = [];
        console.log('res:' + res.data.privileges[0])

        // for (let i = 0; i < res.data.playlist.tracks.length; i++) {
        //   if (res.data.privileges[i].st >= 0) {
        //     canplay.push(res.data.playlist.tracks[i])
        //   }
        // }

        that.setData({
          list: res.data,
          canplay: canplay,
          // data中根本就没有canplay这个值，渲染页面也没有这个值的渲染。这样做有什么意义？将所有的canplay都删掉也可以
          toplist: (options.from == 'stoplist' ? true : false),   //options.from是传递过来的值 toplist
          cover: id2Url.id2Url('' + (res.data.playlist.coverImgId_str || res.data.playlist.coverImgId))
          // 上面这句是重点 res.data是服务器返回的
        });
        // console.log(that.data.cover) //这里获取的就是图片地址
        console.log('canplay:' + res.data.playlist.coverImgId) //这个获取的又是另外一个值，也是一段数字
        wx.setNavigationBarTitle({
          title: res.data.playlist.name
        })
        // 设置title
        console.log('list:'+that.data.list)
        
      }, fail: function (res) {
        wx.navigateBack({
          delta: 1
        })
      }
    });
  },

  userplaylist: function (e) {
    var userid = e.currentTarget.dataset.userid;
    wx.redirectTo({
      url: '../user/index?id=' + userid
    })
  },
  playall: function (event) {
    this.setplaylist(this.data.canplay[0], 0);
    app.seekmusic(1)

  },
  setplaylist: function (music, index) {
    //设置播放列表，设置当前播放音乐，设置当前音乐在列表中位置
    app.globalData.curplay = app.globalData.curplay.id != music.id ? music : app.globalData.curplay;
    app.globalData.index_am = index;//event.currentTarget.dataset.idx;
    app.globalData.playtype = 1;
    var shuffle = app.globalData.shuffle;
    app.globalData.list_sf = this.data.canplay;//this.data.list.tracks;
    app.shuffleplay(shuffle);
    app.globalData.globalStop = false;
  },
  playmusic: function (event) {
    let music = event.currentTarget.dataset.idx;
    let st = event.currentTarget.dataset.st;
    if (st * 1 < 0) {
      wx.showToast({
        title: '歌曲已下架',
        icon: 'success',
        duration: 2000
      });
      return;
    }
    music = this.data.list.playlist.tracks[music];
    this.setplaylist(music, event.currentTarget.dataset.idx)
  }
});