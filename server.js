/**
 * Created by HP_PC on 12/18/2016.
 */
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');



var usernames = [];


server.listen(process.env.PORT || 3000);

mongoose.connect('mongodb://aj160:aj160@ds139288.mlab.com:39288/chatapplication',function(error){
    if(error) {console.log(error);}
    else {console.log('Connected to database');}
});

var chatSchema = mongoose.Schema({
    username:String,
    message:String,
    timeSent: {type:Date,default:Date.now()}
});

var Chat = mongoose.model('Message',chatSchema);

app.get('/',function(req,res){
    res.sendFile(__dirname + '/index.html');
});

io.sockets.on('connection',function(socket){

    //load previous messages
    var query =  Chat.find({});
    query.sort('-timeSent').limit(10).exec(
    function(error,data){
        if(error) throw error;
        console.log('sending old messages');
        socket.emit('load messages',data);
    });


   //new user
    socket.on('new user',function(data,ob){
        if(usernames.indexOf(data) != -1){
            ob(false);
        }
        else{
            ob(true);
            socket.username = data;
            usernames.push(socket.username);
            updateUsernames();
        }
    });

    // update username
    function updateUsernames(){
        io.sockets.emit('usernames',usernames);
    }


    // send message
    socket.on('send message',function(data){
        var newMessage = new Chat({message:data,username:socket.username});
        newMessage.save(function(error){
            if(error) throw error;

        io.sockets.emit('new message',{message:data , username:socket.username});
            console.log(socket.username + ": " + data);
        });

    });


    // disconnettion
    socket.on('disconnect',function(data){
        if(!socket.username) return;
        usernames.splice(usernames.indexOf(socket.username),1);
        updateUsernames();
    });
});