const mongoose = require("mongoose");

var userSchema = new mongoose.Schema({
    openid:String,
    nickName:String,
    avatarUrl:String,
    sessionKey:String,
    uuid:String,
    setuped:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
    }],
    selected:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "course",
    }],
});
userSchema.statics.findByNickName = function(nickName){
    return this.find({nickName:nickName});
};
userSchema.statics.findByOpenid = function (openid) {
    return this.findOne({openid:openid});
};
userSchema.statics.findByUuid = function (uuid) {
    return this.findOne({uuid:uuid});
};
userSchema.statics.findSetupedByUuid = function (uuid) {
    return this.findOne({uuid:uuid}).populate("setuped");
};
userSchema.statics.findSelectedByUuid = function (uuid) {
    return this.findOne({uuid:uuid}).populate("selected");
};
userSchema.statics.findSetupedAndSelectedByUuid = function (uuid) {
    return this.findOne({uuid:uuid}).populate("setuped").populate("selected");
};

mongoose.model("user",userSchema);