const express= require("express");
const bodyParser= require("body-parser");
const mysql = require('mysql');
const ejs = require('ejs');
const session = require('express-session');
const app= express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
// set for ejs
app.set('view engine', 'ejs');

var connection = mysql.createConnection({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "root"
    });
    connection.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
    }
    );
    app.use(
        session({
          secret: 'hehehe',
          resave: false,
          saveUninitialized: true
        })
      );


//connect to views index
app.get("/", function(req, res){
    res.render("index");
    }
    );

//login from database
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    connection.query("SELECT * FROM user3 where username = ? AND password = ? ", [username, password], (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, message: 'Error fetching users' });
        return;
      }
      if (results.length > 0){
        req.session.loggedin = true;
        req.session.username = username;
        res.redirect('/users'); 
      } else {
        res.status(500).json({ success: false, message: 'Authentication failed' });
      }
      
    });
});
    
    app.get('/users', (req, res) => {

        if (!req.session.loggedin) {
          res.redirect('/');
          return;
        }
      
        connection.query('SELECT * FROM user3', (err, results) => {
          if (err) {
            console.error('Error fetching users:', err);
            res.status(500).json({ error: 'Error fetching users' });
            return;
          }
          res.status(200).render('users', { users: results, username: req.session.username });
        });
      
      });

app.post("/api/adduser", function(req, res) {
    var sql = "INSERT INTO user3 (username, password) VALUES ('"+req.body.username+"', '"+req.body.password+"')";
    connection.query(sql, function(err, result) {
        if (err) {
            console.error('Error adding user:', err);
            res.status(500).json({ success: false, error: 'Error adding user' });
        } else {
            console.log("1 record inserted");
            // Assuming the ID of the newly inserted user is available in result.insertId
            res.status(200).json({
                success: true,
                user: {
                    ID: result.insertId,
                    username: req.body.username,
                    password: req.body.password
                }
            });
        }
    });
});

    //signout using /api/signout
    app.post('/api/signout', (req, res) => {
        req.session.loggedin = null;
        req.session.username = null;
      
        res.status(200).json({ success: true, message: 'Success' });
      
      });

//delete from the table using /api/delete
app.post("/api/delete", function(req, res){
    var sql = "DELETE FROM user3 WHERE ID = '"+req.body.ID+"'";
    connection.query(sql, function (err, result) {
        if (err) throw err;
        
        console.log("1 record deleted");

        // Decrease the ID counter by 1
        var updateSql = "ALTER TABLE user AUTO_INCREMENT = " + (req.body.ID - 1);
        connection.query(updateSql, function (err, result) {
            if (err) throw err;
            console.log("ID counter decreased");
        });

        res.redirect("/users");
    });
});



    const PORT = 3000;
    app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("http://localhost:3000");
});
