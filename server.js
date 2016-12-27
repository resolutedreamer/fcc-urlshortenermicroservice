// server.js
// where your node app starts

// init project
var express = require('express');

//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
var app = express();

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;
var ObjectID = mongodb.ObjectID;

// Connection URL. This is where your mongodb server is running.
var url = process.env.MONGOURL;

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});

function checkURL (possibleURL) {
  var regex = /(https?:\/\/)?([\w\d]+\.)?[\w\d]+\.\w+\/?.+/;
  console.log(regex);
  if (possibleURL.match(regex)){
    console.log("A Match!");
    return true;
  }
  console.log("No Match");
  return false;
}

app.get("/new/*", function (req, res) {
  console.log("GET /new/*")
  var params = req.params;
  console.log(params);
  var possibleURL = params[0];
  console.log(possibleURL);
  var finalresult = {}
  if (!checkURL(possibleURL)) {
    console.log("Badly formed URL");
    finalresult["error"] = "Wrong url format, make sure you have a valid protocol and real site.";
    res.json(finalresult);
    return;
  }
  
  finalresult["original_url"] = possibleURL;
  finalresult["short_url"] = null;

  // Use connect method to connect to the Server
  MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      console.log('Connection established to', url);
      
      // Get the documents collection
      var collection = db.collection('urls');
  
      //Create some urls
      var url1 = {url: possibleURL};
      
      // Insert some users
      collection.insert([url1], function (err, result) {
        if (err) {
          console.log(err);
        } else {
          console.log('Inserted %d documents into the "url" collection. The documents inserted with "_id" are:', result.length, result);
          var ops = result['ops'];
          console.log('ops');
          var id = ops[0]['_id'];
          console.log(id);
          var baseurl = "https://resolutedreamer-fcc-urlshortenermicroservice.gomix.me/";
          finalresult["short_url"] = baseurl + id;
          res.json(finalresult);
        }
        //Close connection
        db.close();
      });
    }
  });
});

app.get("/*", function (req, res){
  console.log("GET /*")
  var params = req.params;
  var redirect_id = params[0];

  console.log(params);
  console.log(typeof redirect_id);
  console.log(redirect_id);
  var finalresult = {};
  
  // Use connect method to connect to the Server
  MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error:', err);
    } else {
      //HURRAY!! We are connected. :)
      console.log('Connection established to', url);
  
      // Get the documents collection
      var collection = db.collection('urls');

      // Query
      try {
        var objectID = ObjectID.createFromHexString(redirect_id);
        var query = { _id: ObjectID.createFromHexString(redirect_id) };
        console.log(query);
      }
      catch (e) {
        console.log("Exception! Bad OID");
        finalresult["error"] = "This url is not on the database.";
        res.json(finalresult);
        return;
      }
      //We have a cursor now with our find criteria
      var cursor = collection.find( query ).toArray(function (err, findresult) {
        if (err) {
          console.log(err);
          finalresult["error"] = "This url is not on the database.";
          res.json(finalresult);
        }
      
        else if (findresult.length) {
          console.log('Fetched:', findresult);
          var long_url = findresult[0]['url'];
          // make it an actual link
          res.redirect(long_url);
        }
        else {
          console.log('No document(s) found with defined "find" criteria!');
          finalresult["error"] = "This url is not on the database.";
          res.json(finalresult);
        }
        db.close();
      });

    }
  });
});