const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const sessionSchema = new mongoose.Schema({ 
  duration: { type: Number, required: true },
  description: { type: String, required: true },
  date: String
});
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  log: [sessionSchema]
});
const Session = mongoose.model('Session', sessionSchema);
const User = mongoose.model('User', userSchema);


app.use(cors());
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false }));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.post('/api/exercise/new-user', (req, res) => {
  const usernameInput = req.body.username;
  const newUser = new User({ username: usernameInput });
  newUser.save((err, data) => {
    if (err) res.json(err);
    let resObj = {};
    resObj["username"] = data["username"];
    resObj["_id"] = data['_id'];
    res.json(resObj);
  });
});

app.get('/api/exercise/users', (req, res) => {
  User.find((err, data) => {
    if (err) res.json(err);
      res.json(data);
  });
});

app.post('/api/exercise/add', (req, res) => {
  let { userId, description, duration, date } = req.body;
  
  if (!date) date = new Date().toDateString();
  else date = new Date(date).toDateString();
  
  const newSession = new Session({ duration: parseInt(duration), description, date });
  
  User.findById({ _id: userId }, (err, updatedUser) => {
    if (err) res.json(err);
    updatedUser.log.push(newSession);
    updatedUser.save((err, data) => {
      if (err) res.json(err);
      let resObj = {};
      resObj["_id"] = data['_id'];
      resObj["username"] = data['username'];
      resObj["date"] = date;
      resObj["duration"] = parseInt(duration);
      resObj["description"] = description;
      res.json(resObj);
    });
  });
});

app.get('/api/exercise/log', (req, res) => {
  User.findById({ _id: req.query.userId }, (err, data) => {
    if (err) res.json(err);
    let resObj = { ...data._doc };
    if (req.query.limit) resObj.log = resObj.log.slice(0, req.query.limit);
    if (req.query.from || req.query.to) {
      let fromDate = new Date(0).getTime();
      let toDate = new Date().getTime();
      if (req.query.from) fromDate = new Date(req.query.from).getTime();
      if (req.query.to) toDate = new Date(req.query.to).getTime();
      resObj.log = resObj.log.filter((session) => {
        let sessionDate = new Date(session.date).getTime();
        return sessionDate >= fromDate && sessionDate <= toDate;
      });
    }
    resObj.count = resObj.log.length;
    res.json(resObj);
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
