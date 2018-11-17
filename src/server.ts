import * as express from "express";
import * as bodyParser from "body-parser";
import * as mongoose from 'mongoose';
import { UserModel, ChatModel, IChat, IUser, MessageModel } from "./model";
import { mongoAddr, authServer } from './config';
import axios, { AxiosRequestConfig } from 'axios';
import { create } from "domain";

const port = 5000;
const app = express();
mongoose.connect(mongoAddr + '/notification',{  useNewUrlParser: true },(err)=>{
    if(err){
        console.log(err);
    }
});
mongoose.set('useCreateIndex', true);

async function auth(reqToken: string){
    const authOptions: AxiosRequestConfig = {
        method: 'POST',
        url: authServer+'/auth',
        data: null,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'jwt '+ reqToken
        }
      };
    return await axios(authOptions).then((response=>{
        return response.data
    })).catch((error)=>{
        return {
            authorized: false,
            message: error.response.data
        }
    });
}

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.post('/init', async (req,res) => {
    const user = await UserModel.create({
        _id: req.body._id,
        email: req.body.email, 
        username: req.body.username, 
        language: req.body.language, 
        contacts: new Array()
    });
    if(!user){
        return res.send(new Error('An error Ocurred'));
    }
    return res.json({signup: true, message: 'Registration successful'});
});

app.post('/getUserList', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.send(authorized)}
    UserModel.find({ email: { $ne: req.body.email }}, function(err, users) {
    const userMap = [];
    users.forEach(function(user) {
        if(user.username.match(new RegExp(req.body.search,"i"))){
            userMap.push({email: user.email,username: user.username});
        }
    });
    res.send(userMap);
    })
});

app.post('/getUser', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.send(authorized)}
    UserModel.findOne({ _id: req.body.user }, function(err, user) {
        res.json(user);
    }).catch(err => {
        res.send('An Error has ocurred');
    })
});

app.post('/addUser', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.send(authorized)}
    UserModel.find({email: { $in: req.body.users}}, function(err, users: Array<IUser>) {
    if(err) {return res.json({added: false, message: 'User already added'});}
    let added = false;
    if((users[0].contacts.indexOf(users[1]._id) < 0) && (users[0].contacts.indexOf(users[1]._id) < 0)) {
        users[0].contacts.push(users[1]._id);
        users[1].contacts.push(users[0]._id);
        users[0].save();
        users[1].save();
        added = true;
    }
    if(added){
        const conversation = createConversation(users[0]._id,users[1]._id);
        conversation.then((data)=>{
            ChatModel.findOne({ _id:data._id})
            .populate({ path: 'participants', select: 'username' })
            .exec((err, conversation) =>{
                return res.json(conversation);
            })
        })
    } else {
        return res.json({added: false, message: 'User already added'});
    }
    });
});

app.post('/getContacts', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    UserModel.findOne({email: req.body.email})
    .populate('contacts','username')
    .exec((err, users) =>{
        return res.json({authorized: authorized.authorized,contacts: users.contacts});
    })
});

app.post('/getConversations', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    ChatModel.find({ participants: { $in: mongoose.Types.ObjectId(req.body._id) } })
    .populate({path:'participants',select:'username'})
    .exec((err, conversations) =>{
         return res.json({authorized: authorized.authorized,conversations: conversations});
     })
});

app.post('/getConversation', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    ChatModel.findOne({ _id:req.body._id})
    .populate({ path: 'participants', select: 'username' })
    .populate({ path: 'messages', select:'-_id'})
    .exec((err, conversation) =>{
         return res.json({authorized: authorized.authorized,conversation: conversation});
     })
});

app.post('/newMessage', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    ChatModel.findOne({ _id:req.body._id},(err,conversation: IChat)=>{
        createMessage(req.body.user,req.body.message,req.body.type,req.body.date).then((message)=>{
            conversation.messages.push(message._id);
            conversation.save();
        });
        return res.json({authorized: authorized.authorized,conversations: conversation});
     })
});

app.post('/newConversation', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    createConversation(...req.body.users).then( newConversation => {
        ChatModel.findOne({ _id:newConversation._id})
            .populate({ path: 'participants', select: 'username' })
            .exec((err, conversation) =>{
                return res.json({authorized: authorized.authorized, added: true ,conversation: conversation});
            })
    })
});

app.post('/remove', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
        removeContact(req.body.user,req.body.contact);
        removeContact(req.body.contact,req.body.user);
        ChatModel.deleteOne({_id: req.body.conversation})
        .then(conversation => {
            res.json(conversation);
        });
});

app.post('/changeUsername', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    UserModel.findById({_id: req.body.user}).then(user => {
        user.username = req.body.change;
        user.save();
        res.json({changed: true, value: user.username});
    });
});
app.post('/changeLanguage', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    UserModel.findById({_id: req.body.user}).then(user => {
        user.language = req.body.change;
        user.save();
        res.json({changed: true, value: user.language});
    });
});

function createConversation(...users){
    return ChatModel.create({
        _id:  mongoose.Types.ObjectId(),
        participants: users,
        messages:new Array()
    });
}

function createMessage(user, message,type,date){
    return MessageModel.create({
        _id:  mongoose.Types.ObjectId(),
        user:'',
        sender: user,
        message: message,
        type: type,
        date: date
    });
}


function removeContact(userID, contact){
    UserModel.findById({_id: userID})
    .then(user => {
        user.contacts = user.contacts.filter(e => e.toString() !== contact);
        user.save();
    });
}

app.listen(port, () => {
    console.log(`Notification Server is up on port ${port}`);
});