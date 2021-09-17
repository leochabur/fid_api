// Levanta las variables de entorno del archivo .env
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

//------------------------------- Variables de Entorno ----------------------------------
let vars = {
  //General
  env: process.env.NODE_ENV || 'development',
  pwd: process.env.PWD || "",
  port: process.env.PORT || 80,

  mongodbURI: process.env.MONGODB_URI || "mongodb://localhost:27017",
  adminName: process.env.ADMIN_NAME || "admin",
  adminPass: process.env.ADMIN_PASS || "master2021",

  fcmServerToken: "AAAAscooTHY:APA91bEdTsVwgqcxhP9xk4YXVq47vSa7rlglolxUm8RBAQnpvnLPaiYOJbQ5uoqDpkbiHcyHx5h4yULs7ZSRXSoStP657rWoCX9SS6b5_bW898lybWhLAkVyP9dP4gb-ayLpKudHzgQH",

  jwtSecret: process.env.JWT_SECRET || "YOUR_secret_key", // key privada que uso para hashear passwords
  jwtDfltExpires: process.env.JWT_DURATION || 3600, // Cuanto duran los tokens por dflt en segundos
  jwtSaltWorkFactor: process.env.SALT_WORK_FACTOR || 10, //A: las vueltas que usa bcrypt para encriptar las password

}

module.exports = vars;
