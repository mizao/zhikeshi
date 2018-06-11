const products = require('../services/products');

const APIError = require('../rest').APIError;

const config = require('../config');

const request = require('sync-request');

const uuidv1 = require("uuid/v1");

const model  =require("../models");
const service = require("../services");

var user = model.user;
var course = model.course;
var chatRoom = model.chatRoom;

module.exports = {
    'GET /api/products': async (ctx, next) => {
        ctx.rest({
            products: products.getProducts()
        });
    },

    'POST /api/products': async (ctx, next) => {
        var p = products.createProduct(ctx.request.body.name, ctx.request.body.manufacturer, parseFloat(ctx.request.body.price));
        ctx.rest(p);
    },

    'POST /api/login': async (ctx, next) => {
        var res = request("GET",'https://api.weixin.qq.com/sns/jscode2session?appid='+config.APPID+'&secret='+config.AppSecret+'&js_code='+ctx.request.body.code+'&grant_type=authorization_code');
        var reqRes = JSON.parse(res.getBody("utf8"));
        console.log(reqRes);
        if(reqRes.errcode===undefined) {
            var dbRes = await user.findByOpenid(reqRes.openid);
            console.log(dbRes);
            if (dbRes === null) {
                // var collectionEntity = new collection({
                //     songList:[]
                // });
                // collectionEntity.save();
                var userEntity = await service.user.addUser(reqRes.openid, ctx.request.body.nickName, ctx.request.body.avatarUrl, reqRes.session_key, uuidv1());
                ctx.rest(userEntity);
            }
            else {
                dbRes.nickName = ctx.request.body.nickName;
                dbRes.avatarUrl = ctx.request.body.avatarUrl;
                dbRes.sessionKey = reqRes.session_key;
                dbRes.save();
                ctx.rest(dbRes);
            }
        }
        else{
            throw new APIError(reqRes.errcode, "api.weixin.qq.com/sns/jscode2session 访问出错");
        }
    },

    'POST /api/createCourse': async (ctx,next) => {
        if(ctx.request.body.uuid===undefined){
            throw new APIError("createCourse:uuid_missed","uuid not found in request");
        }
        var userEntity = await user.findByUuid(ctx.request.body.uuid);
        if(userEntity === null){
            throw new APIError("error uuid", "没有uuid对应的user");
        }
        var courseEntity = await service.course.addcourse(userEntity._id, ctx.request.body.name, ctx.request.body.school, ctx.request.body.location, ctx.request.body.teacherName, ctx.request.body.extra, ctx.request.body.time);
        userEntity.setuped.push(courseEntity._id);
        userEntity.save();
        ctx.rest({message:"success"});
    },

    'POST /api/selectCourse' : async(ctx, next) => {
        if(ctx.request.body.uuid ===undefined){
            throw  new APIError("selectCourse:uuid_missed", "uuid not found in request");
        }
        ctx.rest(await service.course.selectCourse(ctx.request.body.uuid, ctx.request.body.courseId));
    },

    'DELETE /api/deleteSelectedCourse/:uuid/:courseId' : async(ctx, next) => {
        if(ctx.params.uuid === undefined){
            throw new APIError("deleteSelectedCourse:uuid_missed", "uuid not found in request");
        }
        ctx.rest(await service.user.deleteSelectedCourse(ctx.params.uuid, ctx.params.courseId));
    },

    'DELETE /api/deleteSetupedCourse/:uuid/:courseId' : async(ctx, next) => {
        if(ctx.params.uuid === undefined){
            throw new APIError("deleteSetupedCourse:uuid_missed", "uuid not found in request");
        }
        ctx.rest(await service.user.deleteSetupedCourse(ctx.params.uuid, ctx.params.courseId));
    },

    'POST /api/getSelectedTable' : async(ctx, next) => {
        if (ctx.request.body.uuid === undefined) {
           throw new APIError("getSelectedTable:uuid_missed", "uuid not found in request");
        }
        var sTime = new Date(ctx.request.body.startTime);
        var eTime = new Date(ctx.request.body.endTime);
        var selectedTableOfOneWeek = await service.user.getSelectedTableOfOneWeek(ctx.request.body.uuid, sTime, eTime);
        ctx.rest(selectedTableOfOneWeek);
    },

    'POST /api/getSetupedTable' : async(ctx, next) => {
        if (ctx.request.body.uuid === undefined) {
            throw new APIError("getSelectedTable:uuid_missed", "uuid not found in request");
        }
        var sTime = new Date(ctx.request.body.startTime);
        var eTime = new Date(ctx.request.body.endTime);
        var setupedTableOfOneWeek = await service.user.getSetupedTableOfOneWeek(ctx.request.body.uuid, sTime, eTime);
        ctx.rest(setupedTableOfOneWeek);
    },

    'GET /api/getChatRoomList/:uuid' : async(ctx, next) => {
        if (ctx.params.uuid === undefined) {
            throw new APIError("getChatRoomList:uuid_missed", "uuid not found in request");
        }
        ctx.rest(await service.user.getChatRoomList(ctx.params.uuid));
    },

    'POST /api/modifyCourse' : async(ctx, next) => {
        if (ctx.request.body.uuid === undefined) {
            throw new APIError("modifyCourse:uuid_missed", "uuid not found in request");
        }
        if (ctx.request.body.courseId === undefined) {
            throw new APIError("modifyCourse:courseId_missed", "courseId not found in request");
        }
        var sTime = new Date(ctx.request.body.startTime);
        var eTime = new Date(ctx.request.body.endTime);
        var userEntity = await user.findByUuid(ctx.request.body.uuid);
        var courseEntity = await course.findByNumber(ctx.request.body.courseId);
        if(courseEntity.setupByUser.toString() !== userEntity._id.toString()){
            throw new APIError("modifyCourse:invalid operation", "只能对自己创建的课程做出操作");
        }
        service.course.modifyCourse(courseEntity, ctx.request.body.type,  sTime, ctx.request.body.col, ctx.request.body.row, ctx.request.body.duration);
        ctx.rest({message:"success"});
    },

    'GET /api/searchCourseByNumber/:courseId' : async(ctx, next) => {
        var courseEntity = await course.findByNumber(ctx.params.courseId);
        if(courseEntity === null){
            throw new APIError("searchCourseByNumber:invalid courseId", "无效的courseId");
        }
        ctx.rest({
            code:"success",
            res:{
                name:courseEntity.name,
                id:courseEntity.number,
                teacherName:courseEntity.teacherName,
                school:courseEntity.setupBySchool,
                location:courseEntity.location
            }
        })
    },

    'GET /api/searchCourse/:keyWord' : async(ctx, next) => {
        var key = parseInt(ctx.params.keyWord);
        if(isNaN(key)){
            ctx.rest(await service.course.searchCourseByNameKey(ctx.params.keyWord));
        }
        else {
            ctx.rest(await service.course.searchCourseByNumber(key));
        }
    },

    'GET /api/searchCourseByNameKey/:nameKey' : async(ctx,next) => {
        var courseList = await course.findByNameKey(ctx.params.nameKey);
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
        ctx.rest({
            code: "success",
            courseList: listToShow,
        });
    },

    'GET /api/getNotice/:chatRoomId' : async(ctx, next) => {
        var chatRoomEntity = await chatRoom.findById(ctx.params.chatRoomId);
        if(chatRoomEntity === null){
            throw new APIError("getNotice:invalid chatRoomId", "无效的chatRoomId");
        }
        ctx.rest(chatRoomEntity.notice);
    },

    'POST /api/addNotice' : async(ctx, next) => {
        var userEntityOf = await service.chatRoom.getTeacherByChatRoomId(ctx.request.body.chatRoomId);
        var userEntity = userEntityOf.setupByUser;
        if(userEntity === null){
            throw new APIError("addNotice:invalid chatRoomId", "无效的chatRoomId");
        }
        if(userEntity.uuid !== ctx.request.body.uuid){
            throw new APIError("getNotice:invalid uuid for chatRoomId", "只有教师可以发布公告");
        }
        var chatRoomEntity = await chatRoom.findById(ctx.request.body.chatRoomId);
        chatRoomEntity.notice.push(ctx.request.body.notice);
        chatRoomEntity.save();
        ctx.rest({message:"success"});
    }

    // 'POST /api/addSong': async (ctx,next) => {
    //     if(ctx.cookies.get("uuid")===undefined){
    //         throw new APIError("addSong:cookie_missed","uuid not found in cookie");
    //     }
    //     var userEntity = await user.findCollectionByUuid(ctx.cookies.get("uuid"));
    //     var collectionEntity = userEntity.songList;
    //     console.log(ctx.cookies.get("uuid"));
    //     console.log(collectionEntity);
    //     await collectionEntity.addSong(ctx.request.body.songId);
    //     collectionEntity.save();
    //     ctx.rest({message:"success"});
    // },
    //
    // 'DELETE /api/rmSong/:songId': async(ctx,next) => {
    //     console.log(ctx.params);
    //     if(ctx.cookies.get("uuid")===undefined){
    //         throw new APIError("addSong:cookie_missed","uuid not found in cookie");
    //     }
    //     var userEntity = await user.findCollectionByUuid(ctx.cookies.get("uuid"));
    //     var collectionEntity = userEntity.songList;
    //     await collectionEntity.rmSong(ctx.params.songId);
    //     collectionEntity.save();
    //     ctx.rest({message:"success"});
    // },
    //
    // 'DELETE /api/products/:id': async (ctx, next) => {
    //     console.log(`delete product ${ctx.params.id}...`);
    //     var p = products.deleteProduct(ctx.params.id);
    //     if (p) {
    //         ctx.rest(p);
    //     } else {
    //         throw new APIError('product:not_found', 'product not found by id.');
    //     }
    // }
};
