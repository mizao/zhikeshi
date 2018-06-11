const model  =require("../models");
const APIError = require('../rest').APIError;

var user = model.user;
var course = model.course;
var collection = model.collection;
var counter = model.counter;
var chatRoom = model.chatRoom;

// user.findByNickName("fanche",function(err, res){
//     if(res[0]===undefined)
//         console.log("undefined");
// })
// user.getSessionKeyByOpenid("o4lrb4k92YmR_de2C5h5jkUWnaYo").then(function (res) {
//     console.log(res);
// })

function addUser(openid, nickName, avatarUrl, session_key, uuid){
    var userEntity = new user({
        openid: openid,
        nickName: nickName,
        avatarUrl: avatarUrl,
        sessionKey:session_key,
        uuid:uuid,
        setuped: [],
        selected: [],
    });
    userEntity.save();
    return userEntity;
}

async function getSelectedTableOfOneWeek(uuid, startTime, endTime){
    var courseList = await user.findSelectedByUuid(uuid);
    if(courseList === null){
        throw new APIError("getSelectedTableOfOneWeek:invalid uuid", "无效的uuid");
    }
    var tableOfOneWeek = [];
    function intergrate (course){
        if(startTime>=course.time.startTime && endTime<=course.time.endTime){
            course.time.detail.forEach(function(detailItem){
                if(!course.modify.some(function (modifyItem) {
                    if(!(modifyItem.time>=startTime && modifyItem.time<=endTime)){
                        return false;
                    }
                    if(modifyItem.row===detailItem.row && modifyItem.col===detailItem.col && modifyItem.type===0){
                        return true;
                    }
                    else {
                        return false;
                    }
                })){
                    tableOfOneWeek.push({
                        row:detailItem.row,
                        col:detailItem.col,
                        duration:detailItem.duration,
                        id:course.number,
                        name:course.name,
                        location:course.location,
                        school:course.school,
                        teacherName:course.teacherName,
                        extra:course.extra,
                    })
                }
            })
        }
    }
    courseList.selected.forEach(intergrate);
    return tableOfOneWeek;
}

async function getSetupedTableOfOneWeek(uuid, startTime, endTime){
    var courseList = await user.findSetupedByUuid(uuid);
    if(courseList === null){
        throw new APIError("getSetupedTableOfOneWeek:invalid uuid", "无效的uuid");
    }
    var tableOfOneWeek = [];
    function intergrate (course){
        console.log(course.name);
        if(startTime>=course.time.startTime && endTime<=course.time.endTime){
            course.time.detail.forEach(function(detailItem){
                console.log(course.time.detail);
                if(!course.modify.some(function(modifyItem) {
                    if(!(modifyItem.time>=startTime && modifyItem.time<=endTime)){
                        return false;
                    }
                    if(modifyItem.row===detailItem.row && modifyItem.col===detailItem.col && modifyItem.type===0){
                        return true;
                    }
                    else {
                        return false;
                    }
                })){
                    tableOfOneWeek.push({
                        row:detailItem.row,
                        col:detailItem.col,
                        duration:detailItem.duration,
                        id:course.number,
                        name:course.name,
                        school:course.setupBySchool,
                        location:course.location,
                        teacherName:course.teacherName,
                        extra:course.extra,
                    })
                }
            })
        }
    }
    courseList.setuped.forEach(intergrate);
    return tableOfOneWeek;
}

async function getChatRoomList(uuid) {
    var chatRoomList = [];
    var selectedCourse = await user.findSelectedByUuid(uuid);
    var setupedCourse = await user.findSetupedByUuid(uuid);
    var courseList = selectedCourse.selected.concat(setupedCourse.setuped);
    for(var i in courseList){
        var cr = await chatRoom.findById(courseList[i].chatRoom);
        chatRoomList.push({
            id:await cr._id,
            name:courseList[i].name,
            toReadNum:0,
            onMessageSetted:false,
            recDataList:[]
        });
    }
    return chatRoomList;
}

async function deleteSelectedCourse(uuid, courseId) {
    var userEntity = await user.findByUuid(uuid);
    var courseEntity = await course.findByNumber(courseId);
    userEntity.selected.splice(userEntity.selected.indexOf(courseEntity._id.toString()), 1);
    userEntity.save();
    return ({message:"success"});
}

async function deleteSetupedCourse(uuid, courseId) {
    var userEntity = await user.findByUuid(uuid);
    var courseEntity = await course.findByNumber(courseId);
    userEntity.setuped.splice(userEntity.setuped.indexOf(courseEntity._id.toString()), 1);
    userEntity.save();
    var selectedByUsers = await course.findSelectedByNumber(courseId);
    console.log(selectedByUsers.selectedByUser);
    selectedByUsers.selectedByUser.forEach(function (selectedItem) {
        selectedItem.selected.splice(selectedItem.selected.indexOf(courseEntity._id.toString()), 1);
        selectedItem.save();
    });
    courseEntity.remove();
    return ({message:"success"});
}

module.exports = {
    addUser: addUser,
    getSelectedTableOfOneWeek: getSelectedTableOfOneWeek,
    getSetupedTableOfOneWeek: getSetupedTableOfOneWeek,
    deleteSelectedCourse: deleteSelectedCourse,
    deleteSetupedCourse: deleteSetupedCourse,
    getChatRoomList: getChatRoomList,
};