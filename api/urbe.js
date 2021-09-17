const mongo = require('../lib/mongo');
const fetch = require('node-fetch');

const newEvent = async (req, res) => {
  //TODO: AGREGAR LA WHITELIST DE IPS

  // req.body fields:
  // Fecha:"2020-10-14T17:14:14"
  // Mensaje:"Velocidad Excedida : Permitida 90 - Alcanzada 100 - Duracion: 00:02:35"
  // Codigo:"92"
  // Latitud:-34.131187438964844
  // Longitud:-59.070030212402344
  // Interno: "234"
  // Patente: "NPE 635"

  //Lo guardo en una DB y respondo el request

  

  try {
    await mongo.post("urbetrack", "events", req.body)
      .catch(e => {
        console.log(e);
        console.log("Failed to add new user!");
        throw "Failed to add new user!";
      });
    
    
    res.send("OK!");

    //Reenvío la info al sistema de Masterbus si es necesario (Geocerca Entrada)
    if (req.body.Codigo == "910") {
      //http://traficonuevo.masterbus.net/api/v1/close?bus=12314&fecha=2020-12-21T11:51:09
      var traficoURL = "http://traficonuevo.masterbus.net/api/v1/close?";
      traficoURL += "bus=" + req.body.Interno.toString();
      traficoURL += "&fecha=" + req.body.Fecha.toString();
      //Lo guardo en una DB y resondo el request
      fetch(traficoURL, {
        method: 'POST',
        body: {},
        headers: { Authorization: "3d524a53c110e4c22463b10ed32cef9d" },
      })
        .then(r => console.log(r.json()))
        .catch(e => console.log(e));
    }
  } catch (e) {
    console.log(e => console.log(e));
    res.status(500).send("Something went wrong!");
  }
}

module.exports = { newEvent };
