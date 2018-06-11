const mongoose = require("mongoose");

var chatRoomSchema = new mongoose.Schema({
    message: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },
        text: String,
    }],
    notice: [String],
});

chatRoomSchema.statics.findNoticeById = function (chatRoomId) {
    return this.findById(chatRoomId);
}

mongoose.model("chatRoom",chatRoomSchema);