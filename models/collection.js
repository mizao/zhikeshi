const mongoose = require("mongoose");

var collectionSchema = new mongoose.Schema({
    owner:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    songList:[String],
});

collectionSchema.statics.getSongListByOpenid = function(openid){
    return this.findOne({openid:openid}).songList;
};

collectionSchema.statics.addSongByopenid = async function (openid,songId) {
    var collectionEntity = await this.findOne({openid:openid});
    collectionEntity.songList.add(songId);
    collectionEntity.save();
};

collectionSchema.methods.addSong = function (songId) {
    this.songList.push(songId);
};
collectionSchema.methods.rmSong = async function (songId) {
    var tmpId = this.songList.indexOf(songId);
    this.songList.splice(tmpId,1);
};

mongoose.model("collection",collectionSchema);