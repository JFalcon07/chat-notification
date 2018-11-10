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
    messages: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }] }
});
exports.ChatModel = mongoose.model('Chat', exports.ChatSchema);
;
exports.MessageSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true },
    type: { type: String, required: true },
    date: { type: Date, required: true }
});
exports.MessageModel = mongoose.model('Message', exports.MessageSchema);
