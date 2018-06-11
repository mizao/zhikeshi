const mongoose = require("mongoose");
mongoose.connect("mongodb://chenou:chenou@test.qingdadao.com/test");

require("./user");
require("./course");
require("./chatRoom");
require("./counter");


module.exports = {
    user: mongoose.model("user"),
    course:mongoose.model("course"),
    chatRoom:mongoose.model("chatRoom"),
    counter:mongoose.model("counter"),
};