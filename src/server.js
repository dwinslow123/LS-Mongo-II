const bodyParser = require('body-parser');
const express = require('express');

const Post = require('./post.js');

const STATUS_USER_ERROR = 422;

const server = express();
// to enable parsing of json bodies for post requests
server.use(bodyParser.json());

const sendUserError = (err, res) => {
  if (typeof err === 'string') {
    res.json({ error: err });
  } else {
    res.json(err);
  }
};

server.get('/accepted-answer/:soID', (req, res) => {
  Post.findOne({ soID: req.params.soID }, (err, question) => {
    if (err) {
      sendUserError(err, res);
      return;
    }
    if (!question) {
      sendUserError("Couldn't find a question with given soID", res);
      return;
    }

    const answerID = question.acceptedAnswerID;

    Post.findOne({ soID: answerID }, (answerErr, answer) => {
      if (answerErr) {
        sendUserError(answerErr, res);
        return;
      }
      if (!answer) {
        sendUserError("Couldn't find an accepted answer", res);
        return;
      }
      res.json(answer);
    });
  });
});

server.get('/top-answer/:soID', (req, res) => {
  Post.findOne({ soID: req.params.soID }, (err, question) => {
    if (err) {
      sendUserError(err, res);
      return;
    }
    if (!question) {
      sendUserError("Couldn't find a question with given soID", res);
      return;
    }

    const answerID = question.acceptedAnswerID;

    Post.findOne({
      soID: { $ne: answerID },
      parentID: question.soID
    })
    .sort({ score: 'desc' })
    .exec((answerErr, answer) => {
      if (answerErr) {
        sendUserError(answerErr, res);
        return;
      }
      if (!answer) {
        sendUserError("Couldn't find an accepted answer", res);
        return;
      }
      res.json(answer);
    });
  });
});

server.get('/popular-jquery-questions', (req, res) => {
  const query = {
    parentID: null,
    tags: 'jquery',
    $or: [
      { score: { $gt: 5000 } },
      { 'user.reputation': { $gt: 200000 } }
    ]
  };

  Post.find(query, (err, posts) => {
    if (err) {
      sendUserError(err, res);
      return;
    }
    res.json(posts);
  });
});

server.get('/npm-answers', (req, res) => {
    Post.find({ parentID: null, tags: 'npm' }, (err, questions) => {
      if (err) {
        sendUserError(err, res);
        return;
      }
      if (questions.length === 0) {
        sendUserError("No questions tagged with NPM could be found", res);
        return;
      }

      const questionIDs = questions.map(question => question.soID);
      const answerQuery = { parentID: { $in: questionIDs } }
      Post.find(answerQuery, (answersErr, answers) => {
        if (answersErr) {
          sendUserError(answersErr, res);
          return;
        }
        res.json(answers);
      });
    });
  });

module.exports = { server };
