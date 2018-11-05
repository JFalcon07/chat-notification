import * as mongoose from 'mongoose';
export interface IUser extends mongoose.Document {
    _id: mongoose.Schema.Types.ObjectId;
    email: string;
    username: string;
    language: string;
    contacts: Array<mongoose.Schema.Types.ObjectId>;
  };

export const UserSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: {type:String, required: true, unique : true}, 
    username: {type:String, required: true},
    language: {type:String, required: true},
    contacts: {type: [{ type: mongoose.Schema.Types.ObjectId}]}
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);

export interface IChat extends mongoose.Document {
    _id: mongoose.Schema.Types.ObjectId;
    participants: Array<mongoose.Schema.Types.ObjectId>;
    messages: Array<mongoose.Schema.Types.ObjectId>;
  };

export const ChatSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: {type: [{ type: mongoose.Schema.Types.ObjectId}]}
});

export const ChatModel = mongoose.model<IChat>('Chat', ChatSchema);

export interface IMessage extends mongoose.Document {
    _id: mongoose.Schema.Types.ObjectId;
    sender: mongoose.Schema.Types.ObjectId;
    message: string;
    type: string;
    date: Date
  };

export const MessageSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: {type:String, required: true},
    type: {type:String, required: true},
    date: {type:Date, required: true},
});

export const MessageModel = mongoose.model<IMessage>('Message', MessageSchema);