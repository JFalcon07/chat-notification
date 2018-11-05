import * as express from "express";
import * as bodyParser from "body-parser";
import * as mongoose from 'mongoose';
import { UserModel, ChatModel, IUser, MessageModel } from "./model";
import { mongoAddr, authServer } from './config';
import axios, { AxiosRequestConfig } from 'axios';

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

app.post('/addUser', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.send(authorized)}
    UserModel.find({email: { $in: req.body.users}}, function(err, users: Array<IUser>) {
    if(err) {return res.json({added: false, message: 'User already added'});}
        const added = Boolean(users[0].contacts.includes(users[1]._id) && users[1].contacts.includes(users[0]._id));
    if(!users[0].contacts.includes(users[1]._id)){
        users[0].contacts.push(users[1]._id);
        users[0].save();
    }
    if(!users[1].contacts.includes(users[0]._id)){
        users[1].contacts.push(users[0]._id);
        users[1].save();
    }
    if(!added){
        createConversation(users[0]._id,users[1]._id);
        return res.json({added: true, message: 'User added sucessfully'});
    }
    return res.json({added: false, message: 'User already added'});
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
    .populate('participants','username')
    .exec((err, conversations) =>{
         return res.json({authorized: authorized.authorized,conversations: conversations});
     })
});

app.post('/getConversation', async (req,res)=>{
    const authorized = await auth(req.body.token);
    if(!authorized.authorized) { return res.json(authorized)}
    ChatModel.find({ _id:req.body._id})
    .populate('participants','username')
    .exec((err, conversations) =>{
        console.log(conversations)
         return res.json({authorized: authorized.authorized,conversations: conversations});
     })
});

function createConversation(...users){
    ChatModel.create({
        _id:  mongoose.Types.ObjectId(),
        participants: users,
        messages:new Array()
    });
}

function createMessage(user, message){
    MessageModel.create({
        _id:  mongoose.Types.ObjectId(),
        sender: user,
        message: message,
        type: 'text',
        date: new Date()
    });
}

app.listen(port, () => {
    console.log(`Notification Server is up on port ${port}`);
});