// JSON con todas las variables de entorno y config
const env = require('./env');

const login = require('./api/login'); // API Login
const urbe = require('./api/urbe');   // API Recibir mensajes urbetrack
const fcm = require('./api/fcm');     // API Firebase Cloud Messaging
const rest = require('./api/rest');   // API Rest para devices

const express = require('express');
var app = express();
const port = env.port;
const middleware = require('./lib/middleware');
app = middleware(app);

const createAdminUser = async () => {
    try {
        const mongo = require('./lib/mongo');
        const crypto = require('./lib/crypto');

        // Borro los admins anteriores (solo tiene que haber uno)
        await mongo.deleteMany("admin", "users", { rol: "admin" })
            .catch((e) => {
                console.log(e);
                throw "Failed to delete old admins";
            });

        const hashedPass = await crypto.encrypt(env.adminPass);
        const admin = {
            name: env.adminName,
            pass: hashedPass,
            rol: "admin"
        }
        await mongo.post("admin", "users", admin)
            .catch((e) => {
                console.log(e);
                throw "Failed to create admin!";
            });

    } catch (error) {
        console.log(error);
        throw "Failed to create admin user!";
    }

};

//Agrego los scripts de views
app.use('/public', express.static(process.cwd() + '/public'));

// API para obtener token de login
app.post('/api/login', login.login);
// API para agregar un usuario al sistema
app.post('/api/addUser', login.addUser);
// API para eliminar un usuario al sistema
app.delete('/api/removeUser', login.removeUser);

// API para postear un de evento de urbetrack
app.post('/api/post/urbe/event', urbe.newEvent);

// Push a los devices
app.post('/api/fcm/push', fcm.push);
// Obtengo el token del interno
//app.post('/api/fcm/getToken/:interno', fcm.getInternToken );

// Obtengo el token del interno
app.all('/rest/:db/:col/:id?', rest.all);

createAdminUser()
    .then(() => app.listen(port, () => console.log(`Server listening at ${port}`)))

