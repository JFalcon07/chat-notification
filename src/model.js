"use strict";
exports.__esModule = true;
var mongoose = require("mongoose");
;
exports.UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    language: { type: String, required: true },
    contacts: { type: [{ type: mongoose.Schema.Types.ObjectId }] }
});
exports.UserModel = mongoose.model('User', exports.UserSchema);
;
exports.ChatSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: { type: [] }
});
exports.ChatModel = mongoose.model('Chat', exports.ChatSchema);
