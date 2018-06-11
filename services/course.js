const model  =require("../models");
const APIError = require('../rest').APIError;
var chatRoomService = require("./chatRoom");
var user = model.user;
var course = model.course;
var counter = model.counter;
var chatRoom = model.chatRoom;
console.log(chatRoomService);
counter.findOne({name:"course"}).then(function (res) {
    if(res === null){
        var counterEntity = new counter({
            name: "course",
            id:0,
        });
        counterEntity.save();
    }
});

async function addcourse(userId, name, school, location, teacherName, extra, time) {
    var chatRoomEntity = new chatRoom({
        message:[],
        notice:[],
    });
    chatRoomEntity.save();
    var courseEntity = new course({
        name: name,
        number:await counter.getNextCourseId(),
        location: location,
        teacherName: teacherName,
        extra:extra,
        selectedByUser:[],
        setupByUser:userId,
        setupBySchool:school,
        time:time,
        modify:[],
        chatRoom:chatRoomEntity._id,
    });
    courseEntity.save();
    return courseEntity;
};

async function selectCourse(uuid, courseId) {
    var userEntity = await user.findByUuid(uuid);
    var courseEntity = await course.findByNumber(courseId);
    if(userEntity === null || courseEntity === null){
        throw new APIError("service:selectCourse","无效的uuid或courseId");
    }
    var selectedCourseList = await user.findSelectedByUuid(uuid);
    var selectedCourseTimeList = [];
    selectedCourseList.selected.forEach(function (course) {
        selectedCourseTimeList.push(course.time);
    });
    var tableBlock = [];
    courseEntity.time.detail.forEach(function (block) {
        for(var i=0;i<block.duration;i++){
            tableBlock.push(block.col*11+block.row+i);
        }
    });
    selectedCourseTimeList.forEach(function (courseTime) {
        if((courseEntity.time.startTime >= courseTime.startTime && courseEntity.time.startTime <= courseTime.endTime) || (courseEntity.time.endTime >= courseTime.startTime && courseEntity.time.endTime <= courseTime.endTime)){
            var tmpBlock = [];
            courseTime.detail.forEach(function (block) {
                for (var i = 0; i < block.duration; i++) {
                    tmpBlock.push(block.col * 11 + block.row + i);
                }
            });
            console.log(tmpBlock);
            for( var i in tableBlock){
                if(tmpBlock.includes(tableBlock[i])){
                    throw new APIError("selectCourse:time conflict", "所选课程与已选课程时间冲突");
                    return;
                }
            }
        }
    });
    userEntity.selected.push(courseEntity._id);
    userEntity.save();
    courseEntity.selectedByUser.push(userEntity._id);
    courseEntity.save();
    return {
        message:"success"
    }
};

function modifyCourse(courseEntity, type, time, col, row, duration) {
    courseEntity.modify.push({
        type: type,  //0删，1增
        time: time,
        row:row,
        col:col,
        duration:duration,
    });
    var day = new Date(time);
    day.setDate(day.getDate()+Number(col)-1);
    if(Number(type) === 0){
        chatRoomService.addNotice(courseEntity.chatRoom, "课程"+courseEntity.name+"于"+day.toLocaleDateString()+'的第'+row+"节课停课一次");
    }

    courseEntity.save();
}

async function searchCourseByNameKey(nameKey){
    var courseList = await course.findByNameKey(nameKey);
    var listToShow = [];
    courseList.forEach(function (course) {
        listToShow.push({
            name:course.name,
            id:course.number,
            teacherName:course.teacherName,
            school:course.setupBySchool,
            location:course.location
        })
    });
    return {
        code:"listToShow",
        courseList:listToShow
    };
};

async function searchCourseByNumber(courseId) {
    var courseEntity = await course.findByNumber(courseId);
    if(courseEntity === null){
        throw new APIError("searchCourseByNumber:invalid courseId", "无效的courseId");
    }
    return {
        code: "success",
        courseList: [{
            name: courseEntity.name,
            id: courseEntity.number,
            teacherName: courseEntity.teacherName,
            school: courseEntity.setupBySchool,
            location: courseEntity.location
        }]
    };
}
// var detail = [
//     {
//         row:7,
//         col:3,
//         duration:1
//     },
//     {
//         row:5,
//         col:3,
//         duration:2
//     },
//     {
//         row:3,
//         col:3,
//         duration:2
//     },
//     {
//         row:2,
//         col:2,
//         duration:1,
//     },
//     {
//         row:3,
//         col:2,
//         duration:1
//     }
// ];
//     for(var i in detail){
//         if(detail[i].duration !== 0 && (detail[i].row+detail[i].duration) !== 5 && (detail[i].row+detail[i].duration) !== 9){
//             for(var j in detail){
//                 if(detail[j].duration!==0 && detail[i].col===detail[j].col && (detail[i].row+detail[i].duration)===detail[j].row){
//                     detail[i].duration += detail[j].duration;
//                     detail[j].duration = 0;
//                 }
//             }
//         }
//     }
//     console.log(detail);

// course.findByNumber(5).then(function (res) {
//     console.log(res.time.startTime.getMonth());
//     console.log(res.time.startTime.getDay());
//     console.log(res.time.endTime.getDay());
// });

module.exports = {
    addcourse: addcourse,
    selectCourse: selectCourse,
    modifyCourse: modifyCourse,
    searchCourseByNameKey:searchCourseByNameKey,
    searchCourseByNumber:searchCourseByNumber,
};