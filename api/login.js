const mongo = require('../lib/mongo');
const crypto = require('../lib/crypto');
const mingo = require('mingo');

const login = async (req, res) => {
  try {
    var user = null;
    var name = req.body.user;
    var founds = await mongo.get("admin", "users", { name: name })
      .catch(e => {
        console.log(e);
        res.status(500).send("Failed!");
        throw "Failed to get users from admin/users";
      });

    console.log(`lib@login:  ${founds.length} '${name}' found in admin/users!`);

    if (!founds) throw `lib@login: Error looking for user ${name} in admin/users!`;
    else if (founds.length == 0) res.status(401).send("Invalid username or pass!"); // No existe el usuario
    else if (founds.length > 1) throw (`Error: More than one user found with: founds`);
    else {
      user = founds[0];
      var valid = await crypto.compareEncrypted(req.body.pass, user.pass).catch(e => console.log(e));
      if (valid) {
        delete user.pass;
        const token = await crypto.createJWT(user);
        console.log(`lib@login: ${user} logged in!`)
        res
          .cookie("access-token", JSON.stringify(token), {})
          .send({
            name: user.name,
            token: token,
          });
      } else {
        res.status(401).send("Invalid username or pass!"); // Pass incorrecto
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal error with login!");
  }
};

const addUser = async (req, res) => {
  try {
    const token = await crypto.decodeJWT(req.headers['access-token'] || req.body['access-token']).catch(e => console.log(e));
    const mingoQuery = new mingo.Query({ rol: "admin" });
    const valid = mingoQuery.test(token); // test if an object matches query

    req.body.pass = await crypto.encrypt(req.body.pass);
    if (valid) {
      console.log("1) POST: ");
      console.log(req.body);
      await mongo.post("admin", "users", req.body)
        .catch(e => {
          console.log(e);
          res.status(500).send("Failed!");
          throw "Failed to add new user!";
        });
      res.send("OK!");
    }
    else
      res.status(401).send("Invalid Token!");
  } catch (e) {
    console.log(e);
    res.status(401).send("Invalid Token!");
  }
};

const removeUser = async (req, res) => {
  try {
    const token = await crypto.decodeJWT(req.headers['access-token'] || req.body['access-token']).catch(e => console.log(e));
    const mingoQuery = new mingo.Query({ rol: "admin" });
    const valid = mingoQuery.test(token); // test if an object matches query

    req.body.pass = await crypto.encrypt(req.body.pass);
    if (valid) {
      await mongo.deleteMany("admin", "users", { name: req.body.name })
        .catch(e => {
          console.log(e);
          res.status(500).send("Failed!");
          throw "Failed to delete users!";
        });
      res.send("OK!");
    }
    else
      res.status(401).send("Invalid Token!");
  } catch (e) {
    console.log(e);
    res.status(401).send("Invalid Token!");
  }
};

module.exports = { login, addUser, removeUser };