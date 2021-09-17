//https://firebase.google.com/docs/reference/fcm/rest/v1/projects.messages (API NUEVA)
//https://firebase.google.com/docs/cloud-messaging/send-message (API VIEJA, ES LA Q USAMOS)

// Para la API nueva:
// fullMsgExample = {
//   "name": string,
//   "data": { //Solo entrada. Carga útil de clave / valor arbitraria. La clave no debe ser una palabra reservada ("from", "message_type" o cualquier palabra que comience con "google" o "gcm").
//     string: string,
//     string: string
//   },
//   "notification": {
//     "title": string,
//     "body": string,
//     "image": string
//   },

//   "android": {
//     "collapse_key": string, //clave de agrupamiento del msj
//     "priority": "NORMAL", // "HIGH",
//     "ttl": "345000s", // tiempo que se mantiene vivo el msj si el dispositivo esta offline (4 semans dflt)
//     "restricted_package_name": string, // si quiero filtrar por apps dentro del proyecto de firebase
//     "data": {
//       string: string,
//       string: string,
//       },
//     "notification": {
//       "title": string,
//       "body": string,
//       "image": string
//     },
//     "fcm_options": {
//       "analytics_label": string
//     },
//     "direct_boot_ok": boolean
//   },

//   "apns": { // msjs para ios
//       "headers": {
//         string: string,
//         string: string,
//       },
//       "payload": {
//         object
//       },
//       "fcm_options": {
//         "analytics_label": string,
//         "image": string
//       }
//   },

//   "webpush": {
//     "headers": {
//       string: string,
//       string: string,
//     },
//     "data": {
//       string: string,
//       string: string,
//     },
//     "notification": {
//       object
//     },
//     "fcm_options": {
//       "link": string,
//       "analytics_label": string
//     }
//   },

//   "fcm_options": {
//     "analytics_label": string
//   },

//   // Union field target can be only one of the following:
//   "token": string,
//   "topic": string,
//   "condition": string
//   // End of list of possible types for union field target.
// }

const mongo = require('../lib/mongo');
const mingo = require('mingo');
const crypto = require('../lib/crypto');
const fetch = require('node-fetch');
const env = require('../env');

const push = async (req, res) => {

  const validateFormat = (body) => {
    try {
      if (body.msg.data) return true;
      else return false;
    } catch (error) {
      return false;
    }
  };

  const getMsg = (body) => {

    //Esto es un ejemplo de lo q llega en el body
    //   {
    //     "msg":{
    //         "data":{
    //             "action":"sync",
    //             "desc":"test rotura",
    //             "config": {
    //                 "inference":0.95
    //                 }
    //         }
    //     }
    // }

    //Lo encodeamos con URI para que no se rompa la aplicación java
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

    try {
      var msg = {};
      msg.data = {};
      Object.entries(body.msg.data).forEach((keyValue) => {
        msg.data[keyValue[0]] = URIEncode(body.msg.data[keyValue[0]]);

      });
      msg.notification = {
        title: "Masterbus",
        body: body.msg.notification || ""
      };
      msg.collapse_key = "type_a";
      // msg.android = {};
      // msg.android.collapse_key = body.msg.collapseKey || 'demo';
      // msg.android.priority = body.msg.priority || 'high';
      // msg.android.contentAvailable = body.msg.contentAvailable || true;
      // msg.android.restricted_package_name = body.msg.restrictedPackageName || null;
      return msg;
    } catch (error) {
      console.log(error)
      throw "failed to getMsg!";
    }
  };

  const getTokens = async (body) => {
    var tokens = [];
    const devices = await mongo.get("faceid", "devices", {}, {})
        .catch(e => {
          console.log(e);
          throw "Failed to get devices!";
        });
    
    if (body.msg.internos == null && body.msg.tokens == null) {
      tokens = devices.map(dev => dev.token);
    }
    else if (body.msg.internos != null) {
      Object.values(req.body.internos).forEach(interno => {
        tokens.push(devices.find(device => device.interno == interno));
      })
    }
    else {
      tokens = body.msg.tokens;
    }
    
    console.log(`tokens: ${tokens}`);
    return tokens;
  };

  const sendPushes = async (msg, tokens) => {
    const FCMURL = "https://fcm.googleapis.com/fcm/send";
    const Authorization = `key=${env.fcmServerToken}`;

    var posts = [];
    tokens.forEach((token) => {
      msg.to = token;
      msg.direct_boot_ok = true;

      console.log(msg);
      posts.push(
        fetch(FCMURL,
          {
            method: 'POST', // *GET, POST, PUT, DELETE, etc.
            headers: {
              'Content-Type': 'application/json',
              'Authorization': Authorization
              // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: JSON.stringify(msg)
          }
        )
      );
    });

    var responses = await Promise.all(posts)
      .catch(e => {
        console.log(e);
        throw "Failed to send notifications!";
      });
    
    texts = [];
    responses.forEach(response => {
      texts.push(response.text());
    });
    
    var r = {};
    r.responses = await Promise.all(texts)
      .catch(e => {
        console.log(e);
        throw "Failed to read responses!";
      });

    return r;
  };

  try {
    const token = await crypto.decodeJWT(req.headers['access-token'])
      .catch(e => {
        console.log(e);
        res.status(401).send("access-token required!");
      });

    if (token) {
      const mingoQuery = new mingo.Query({ $or: [{ rol: "client" }, { rol: "admin" }] });
      const validToken = mingoQuery.test(token); // test if an object matches query
      if (validToken) {
        if (validateFormat(req.body)) {
          var msg = getMsg(req.body);
          var tokens = await getTokens(req.body);
          var r = await sendPushes(msg, tokens);
          console.log(r);
          res.send(r);
        }
        else {
          res.status(400).send("Invalid Format!");
        }
      }
      else {
        res.status(401).send("Invalid Token!");
      }
    }
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal error!");
  }
}

module.exports = { push };