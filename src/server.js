"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var model_1 = require("./model");
var config_1 = require("./config");
var axios_1 = require("axios");
var port = 5000;
var app = express();
mongoose.connect(config_1.mongoAddr + '/notification', { useNewUrlParser: true }, function (err) {
    if (err) {
        console.log(err);
    }
});
mongoose.set('useCreateIndex', true);
function auth(reqToken) {
    return __awaiter(this, void 0, void 0, function () {
        var authOptions;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authOptions = {
                        method: 'POST',
                        url: config_1.authServer + '/auth',
                        data: null,
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'jwt ' + reqToken
                        }
                    };
                    return [4 /*yield*/, axios_1["default"](authOptions).then((function (response) {
                            return response.data;
                        }))["catch"](function (error) {
                            return {
                                authorized: false,
                                message: error.response.data
                            };
                        })];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.post('/init', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var user;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, model_1.UserModel.create({
                    _id: req.body._id,
                    email: req.body.email,
                    username: req.body.username,
                    language: req.body.language,
                    contacts: new Array()
                })];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, res.send(new Error('An error Ocurred'))];
                }
                return [2 /*return*/, res.json({ signup: true, message: 'Registration successful' })];
        }
    });
}); });
app.post('/getUserList', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var authorized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, auth(req.body.token)];
            case 1:
                authorized = _a.sent();
                if (!authorized.authorized) {
                    return [2 /*return*/, res.send(authorized)];
                }
                model_1.UserModel.find({ email: { $ne: req.body.email } }, function (err, users) {
                    var userMap = [];
                    users.forEach(function (user) {
                        if (user.username.match(new RegExp(req.body.search, "i"))) {
                            userMap.push({ email: user.email, username: user.username });
                        }
                    });
                    res.send(userMap);
                });
                return [2 /*return*/];
        }
    });
}); });
app.post('/addUser', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var authorized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, auth(req.body.token)];
            case 1:
                authorized = _a.sent();
                if (!authorized.authorized) {
                    return [2 /*return*/, res.send(authorized)];
                }
                model_1.UserModel.find({ email: { $in: req.body.users } }, function (err, users) {
                    if (err) {
                        return res.json({ added: false, message: 'User already added' });
                    }
                    var added = Boolean(users[0].contacts.includes(users[1]._id) && users[1].contacts.includes(users[0]._id));
                    if (!users[0].contacts.includes(users[1]._id)) {
                        users[0].contacts.push(users[1]._id);
                        users[0].save();
                    }
                    if (!users[1].contacts.includes(users[0]._id)) {
                        users[1].contacts.push(users[0]._id);
                        users[1].save();
                    }
                    if (!added) {
                        createConversation(users[0]._id, users[1]._id);
                        return res.json({ added: true, message: 'User added sucessfully' });
                    }
                    return res.json({ added: false, message: 'User already added' });
                });
                return [2 /*return*/];
        }
    });
}); });
app.post('/getContacts', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var authorized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, auth(req.body.token)];
            case 1:
                authorized = _a.sent();
                if (!authorized.authorized) {
                    return [2 /*return*/, res.json(authorized)];
                }
                model_1.UserModel.findOne({ email: req.body.email })
                    .populate('contacts', 'username')
                    .exec(function (err, users) {
                    return res.json({ authorized: authorized.authorized, contacts: users.contacts });
                });
                return [2 /*return*/];
        }
    });
}); });
app.post('/getConversations', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var authorized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, auth(req.body.token)];
            case 1:
                authorized = _a.sent();
                if (!authorized.authorized) {
                    return [2 /*return*/, res.json(authorized)];
                }
                model_1.ChatModel.find({ participants: { $in: mongoose.Types.ObjectId(req.body._id) } })
                    .populate('participants', 'username')
                    .exec(function (err, conversations) {
                    return res.json({ authorized: authorized.authorized, conversations: conversations });
                });
                return [2 /*return*/];
        }
    });
}); });
app.post('/getConversation', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
    var authorized;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, auth(req.body.token)];
            case 1:
                authorized = _a.sent();
                if (!authorized.authorized) {
                    return [2 /*return*/, res.json(authorized)];
                }
                model_1.ChatModel.find({ _id: req.body._id })
                    .populate('participants', 'username')
                    .exec(function (err, conversations) {
                    console.log(conversations);
                    return res.json({ authorized: authorized.authorized, conversations: conversations });
                });
                return [2 /*return*/];
        }
    });
}); });
function createConversation() {
    var users = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        users[_i] = arguments[_i];
    }
    model_1.ChatModel.create({
        _id: mongoose.Types.ObjectId(),
        participants: users,
        messages: new Array()
    });
}
app.listen(port, function () {
    console.log("Notification Server is up on port " + port);
});