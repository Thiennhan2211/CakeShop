const mongoose = require("mongoose");
const MyConstants = require("./MyConstants");

const uri = "mongodb://cake_db:thiennhan27@ac-zfhrooe-shard-00-00.ievaog8.mongodb.net:27017,ac-zfhrooe-shard-00-01.ievaog8.mongodb.net:27017,ac-zfhrooe-shard-00-02.ievaog8.mongodb.net:27017/cakeshop?ssl=true&replicaSet=atlas-111uv7-shard-0&authSource=admin&retryWrites=true&w=majority";

mongoose.connect(uri)
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB error:", err));

module.exports = mongoose;