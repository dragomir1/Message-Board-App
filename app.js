const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const morgan = require('morgan');

const router = express.Router();
const path = require('path');

app.use(morgan('dev'));
app.use(express.static(path.join(__dirname, './static')));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/messagedb');

// set up Schemas
const Schema = mongoose.Schema;

const PostSchema = new mongoose.Schema({
  name: {type: String, required: true, minlength: 4},
  message: {type: String, required: true},
  comments: [{type: Schema.Types.ObjectId, ref: "Comment"}]},
  {timestamp: true});

const CommentSchema = new mongoose.Schema({
  name: {type: String, required: true, minlength: 4},
  comment: {type: String, required: true},
  _post: {type: Schema.Types.ObjectId, ref: "Post"}},
  {timestamp: true});

mongoose.model('Post', PostSchema);
mongoose.model('Comment', CommentSchema);

const Post = mongoose.model('Post');
const Comment = mongoose.model('Comment');

app.get('/', (req, res, next) => {
  Post.find({})
  .populate('comments')
  .exec((err, post) => {
    if(err) {
      console.log("something went wrong");
      res.render('index');
    } else {
      res.render('index', {post: post});
    }
  });
});

app.post('/new_message', (req, res, next) => {
  var post = new Post({
    name: req.body.name,
    message: req.body.message
  });
  post.save((err) => {
    if(err) {
      console.log("there was an error");
    } else {
      console.log("successfully added", req.body)
      res.redirect('/');
    }
  });
});

app.post('/new_comment/:id', (req, res) => {
  const id = req.params.id;
  Post.findOne({_id: id}, (err, post) => {
    const new_comment = new Comment({
      name: req.body.name,
      comment: req.body.comment,
      _post: post._id
    });
    new_comment._post = post._id;
    post.comments.push(new_comment);
    new_comment.save(function(err) {
      console.log(new_comment);
      post.save(function(err) {
        console.log(post);
        if(err) {
          console.log("Error saving", err);
          res.redirect('/');
        } else {
          res.redirect('/');
          }
      });
    });
  });
});


// express CORS
app.use((req, res, next) => {
  res.header('Acess-Control-Allow-Origin', '*');
  res.header('Acess-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.header('Acess-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});


// set up error messages if no routes exist to handle incoming requests
app.use((req, res, next) => {
  const error = new Error("Route not found");
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

// export app module to server
module.exports = app;
