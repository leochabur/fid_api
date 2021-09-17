// GET
// The GET method requests a representation of the specified resource. Requests using GET should only retrieve data.
// HEAD
// The HEAD method asks for a response identical to that of a GET request, but without the response body.
// POST
// The POST method is used to submit an entity to the specified resource, often causing a change in state or side effects on the server.
// PUT
// The PUT method replaces all current representations of the target resource with the request payload.
// DELETE
// The DELETE method deletes the specified resource.
// CONNECT
// The CONNECT method establishes a tunnel to the server identified by the target resource.
// OPTIONS
// The OPTIONS method is used to describe the communication options for the target resource.
// TRACE
// The TRACE method performs a message loop-back test along the path to the target resource.
// PATCH
// The PATCH method is used to apply partial modifications to a resource.

const mongo = require('../lib/mongo');
const mingo = require('mingo');

const URIEncode = (target) => {
  if (typeof target == 'string' || typeof target == 'number' || typeof target == 'boolean') {
    return encodeURIComponent(target.toString());
  }
  else if (typeof target == 'object') {
    Object.entries(target).forEach(keyValue => {
      target[keyValue[0]] = URIEncode(target[keyValue[0]]);
    });
    return target;
  }
  else {
    throw `Invalid type for encoding: ${typeof target}`
  };
};

const getToken = async (req) => {
  const crypto = require('../lib/crypto');
  const token = await crypto.decodeJWT(req.headers['access-token']).catch(e => console.log(e));
  return token;
}

const GET = async (req, res) => {
  try {
    const db = Object.values(req.params)[0];
    const col = Object.values(req.params)[1];
    const id = Object.values(req.params)[2];
    var query = req.query;
    const token = await getToken(req);
    
    if (id) {
      query = `{"_id": "${id}"}`;
      var mingoQuery = null;
      if (db === "admin") mingoQuery = new mingo.Query({ rol: "admin" });
      else mingoQuery = new mingo.Query({ $or: [{ rol: "client" }, { rol: "admin" }] });
      const valid = mingoQuery.test(token); // test if an object matches query

      if (valid) {
        var r = await mongo.getById(db, col, id)
          .catch(e => {
            console.log(e);
            res.status(400).send("Bad request!");
          })
        if (r === null) r = "Not found!";
        r = URIEncode(r);
        res.send(r);
      } else {
        res.status(401).send("Unauthorized!");
      }
    } else if (query) { //Solo los admins pueden leer con query
      const mingoQuery = new mingo.Query({ $or: [{ rol: "client" }, { rol: "admin" }] });
      const valid = mingoQuery.test(token); // test if an object matches query
      if (valid) {
        var r = await mongo.get(db, col, query)
          .catch((e) => {
            console.log(e);
            res.status(400).send("Invalid request!");
          });
        r = URIEncode(r);
        res.send(r);
      } else {
        res.status(401).send("Unauthorized!");
      }
    } else {
      res.status(400).send("Invalid format!");
    }
  } catch (error) {
    console.log(error);
    res.status(400).send("Invalid format!");
  }


};

const HEAD = async (req, res) => {
  const db = Object.values(req.params)[0];
  const col = Object.values(req.params)[1];
  const body = req.body;
  const query = req.query;
};

const POST = async (req, res) => {
  try {
    const db = Object.values(req.params)[0];
    const col = Object.values(req.params)[1];
    const doc = req.body;

    console.log(`doc: ${JSON.stringify(doc)}`);
    const token = await getToken(req);
    var mingoQuery = null;
    if (db === "admin") mingoQuery = new mingo.Query({ rol: "admin" });
    else mingoQuery = new mingo.Query({ $or: [{ rol: "client" }, { rol: "admin" }] });
    const valid = mingoQuery.test(token); // test if an object matches query

    if (valid) {
      console.log(`doc: ${JSON.stringify(doc)}`);
      await mongo.post(db, col, doc)
        .catch((e) => {
          console.log(e);
          res.status(400).send("Invalid request!");
        });
      res.send({status:"ok"});
    } else {
      res.status(401).send("Unauthorized!");
    }
  } catch (error) {
    console.log(error);
    res.status(400).send("Invalid format!");
  }
};

const PUT = async (req, res) => {
  const db = Object.values(req.params)[0];
  const col = Object.values(req.params)[1];
  const body = req.body;
  const query = req.query;
};

const DELETE = async (req, res) => {
  try {
    const db = Object.values(req.params)[0];
    const col = Object.values(req.params)[1];
    var id = Object.values(req.params)[2];
    const token = await getToken(req);
    var query = req.query;
    if (id) {
      var mingoQuery = null;
      if (db === "admin") mingoQuery = new mingo.Query({ rol: "admin" });
      else mingoQuery = new mingo.Query({ $or: [{ rol: "client" }, { rol: "admin" }] });
      const valid = mingoQuery.test(token); // test if an object matches query

      if (valid) {
        var r = await mongo.deleteById(db, col, id, {})
          .catch(e => {
            console.log(e);
            res.status(400).send("Bad request!");
          })
        res.send(r.result);
      } else {
        res.status(401).send("Unauthorized!");
      }
    } else if (query) { //Solo los admins pueden borrar con query
      const mingoQuery = new mingo.Query({ rol: "admin" });
      const valid = mingoQuery.test(token); // test if an object matches query
      if (valid) {
        var r = await mongo.deleteMany(db, col, query, {})
          .catch((e) => {
            console.log(e);
            res.status(400).send("Invalid request!");
          });
        res.send(r.result);
      } else {
        res.status(401).send("Unauthorized!");
      }
    } else {
      res.status(400).send("Invalid format!");
    }
  } catch (error) {
    console.log(error);
    res.status(400).send("Invalid format!");
  }

};

const all = async (req, res) => {
  try {
    switch (req.method) {
      case "GET":
        await GET(req, res);
        break;
      case "POST":
        await POST(req, res);
        break;
      case "DELETE":
        await DELETE(req, res);
        break;
      default:
        res.status(500).send("Something went wrong!");
        break;
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong!");
  }
};

module.exports = { all };

// "http://iotdevices.masterbus.net/rest/urbetrack/events"
// "http://iotdevices.masterbus.net/rest/inti/events"
// "http://iotdevices.masterbus.net/rest/faceid/users"
// "http://iotdevices.masterbus.net/rest/faceid/devices" //{interno:String, token:String, patente:String}
// "http://iotdevices.masterbus.net/rest/faceid/messages"
// "http://iotdevices.masterbus.net/rest/faceid/badTokens" 
// "http://iotdevices.masterbus.net/rest/faceid/logins"
