const model  =require("../models");
const APIError = require('../rest').APIError;
var user = model.user;
var course = model.course;
var counter = model.counter;
var chatRoom = model.chatRoom;

async function addNotice(chatRoomId, notice) {
    console.log("add");
    var ct = await chatRoom.findById(chatRoomId);
    console.log(ct);
    if(ct === null){
        throw new APIError("addNotice:invalid chatRoomId", "无效的chatRoomId");
    }
    ct.notice.push(notice);
    ct.save();
}

async function getTeacherByChatRoomId(chatRoomId) {
    var userEntity = await course.findByChatRoomId(chatRoomId).populate("setupByUser");
    return userEntity;
}


module.exports = {
    addNotice: addNotice,
    getTeacherByChatRoomId: getTeacherByChatRoomId,
}