const mongoose = require("mongoose");

var courseSchema = new mongoose.Schema({
    name: String,
    number: Number,
    location: String,
    teacherName: String,
    extra: String,
    setupByUser:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    selectedByUser:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }],
    setupBySchool: String,
    time: {
        startTime: Date,
        endTime: Date,
        detail: [{
            row:Number,
            col:Number,
            duration:Number,
        }],
    },
    modify: [],
    chatRoom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chatRoom",
    }
});

courseSchema.statics.findByNumber = function(number){
    return this.findOne({number:number});
};
courseSchema.methods.getChatRoom = function () {
    return this;
};
courseSchema.statics.findSelectedByNumber = function (courseId) {
    return this.findOne({number:courseId}).populate("selectedByUser");
};
courseSchema.statics.findByNameKey = function (nameKey) {
    var reg = RegExp(nameKey, 'i');
    return this.find({name:{$regex:reg} });
};
courseSchema.statics.findByChatRoomId = function (chatRoomId) {
    return this.findOne({chatRoom:chatRoomId});
};

mongoose.model("course",courseSchema);