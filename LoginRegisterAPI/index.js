const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "goodreads.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running http://localhost:3000/");
    });
  } catch (e) {
    console.log("DB ERROR " + e);
    process.exit(1);
  }
};

initializeDBAndServer();

// New User Register
app.post("/users/", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const encryptedPassword = await bcrypt.hash(password, 12);
  const selectUserQuery = `
  SELECT * FROM user WHERE username = '${username}';
  `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    const creatUserQuery = `
      INSERT INTO user (username, name, password, gender, location)
      VALUES (
          '${username}',
          '${name}',
          '${encryptedPassword}',
          '${gender}',
          '${location}'
      )
      `;
    const dbResponse = await db.run(creatUserQuery);
    const newUserId = dbResponse.lastID;
    response.send("Created new user with " + newUserId);
  } else {
    response.status = 400;
    response.send("User already exists");
  }
});

// Login User

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
    SELECT * FROM user WHERE username = '${username}';
    `;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid User. Please Register to use");
  } else {
    const isPassCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPassCorrect === true) {
      response.send("Login Success. Welcome back " + dbUser.name);
    } else {
      response.status(400);
      response.send("Invalid Password");
    }
  }
});
