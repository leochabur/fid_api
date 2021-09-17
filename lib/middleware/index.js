const { mongo } = require('mongoose');

//Agrego todos los middlewares
const setMiddleWare = (app) => {
  const multer = require('multer');
  const upload = multer({ dest: 'public/uploads/' });
  const cookieParser = require('cookie-parser') // Herramienta para parsear las cookies
  const bodyParser = require('body-parser'); // Herramienta para parsear el "cuerpo" de los requests
  const morgan = require('morgan'); // Herramienta para loggear
  //Middlewares:

  //Middleware que agrega algo de seguridad a express
  //app.use(helmet()); //Esta comentado porque sino no me andan la paginas por algo del cross-sitting scripting
  //"Morgan" es una herramienta para loggear
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
  console.log(`endpoints@setup: 'morgan' middleware aagregado`);
  app.use(cookieParser());
  console.log(`endpoints@setup: 'cookieParser' middleware agregado`);
  //"bodyParser" es un middleware que me ayuda a parsear los requests
  app.use(bodyParser.urlencoded({ extended: true }));
  console.log(`endpoints@setup: 'bodyParser.urlencoded' middleware agregado`);
  app.use(bodyParser.json());
  console.log(`endpoints@setup: 'bodyParser.json' middleware agregado`);
  // Esto lo hago para devolver el favicon.ico
  //TODO: ver q es el favicon y si es necesario esto
  //app.use(favicon(path.join(__dirname, '../../public/assets/icons', 'favicon.ico')));
  // Agrego una función que me devuelve la URL que me resulta cómoda


  app.use((req, res, next) => {
    const mongo = require("../mongo");
    var doc = {};

    req.ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    req.url = req.protocol + "://" + req.get('host') + req.originalUrl;

    console.log("Req IP: %s", req.ip);
    console.log("Req URL: %s", req.url);
    console.log("Req headers: %s", req.headers);
    console.log("Req body: %s", req.body);

    doc.time = Date.now();
    doc.remoteAddress = req.ip;
    doc.url = req.url;
    doc.method = req.method;
    doc.cookies = req.cookies;
    doc.headers = req.headers;
    doc.params = req.params;
    doc.query = req.query;
    doc.body = req.body;
    
    
    mongo.post("admin", "requests", doc);
    return next();
  });
  // TODO: SEGURIDAD, VALIDACIONES, ETC...
  app.use(upload.single('file'));

  return app;
}

module.exports = setMiddleWare;