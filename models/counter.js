const mongoose = require("mongoose");

var counterSchema = new mongoose.Schema({
    name:String,
    id:Number,
});

counterSchema.statics.getNextCourseId = async function(){
    var ce =  await this.findOneAndUpdate({"name":"course"}, {$inc:{'id':1}},{returnNewDocument:true});
    return ce.id;
};

mongoose.model("counter",counterSchema);