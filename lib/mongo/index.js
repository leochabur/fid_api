const env = require('../../env');
const MongoClient = require('mongodb').MongoClient;
var client = null;

/*---------------------------------INICIALIZACION DE MONGODB -------------------------------------------------
--------------------------------------------------------------------------------------------------------------
------------------------------------------------------------------------------------------------------------*/

const setClient = async (uri) => {

    try {
        const connect = (() => {
            return new Promise((resolve, reject) => {
                client = new MongoClient(uri, { useUnifiedTopology: true, useNewUrlParser: true });
                client.connect(err => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(client);
                    }
                });
            });
        })

        return await connect().catch(e => {
            console.log(e);
            throw "Failed to setClient!";
        });

    } catch (error) {
        console.log(e);
        throw "Failed to setClient!";
    }

};

const getDb = async (db) => {
    try {
        if (client == null)
            client = await setClient(env.mongodbURI)
                .catch(e => {
                    console.log(e);
                    throw "Failed to connecto to client at: " + env.URI;
                });
        if (!client.isConnected)
            await client.connect();
        var res = await client.db(db);
        return res;
    } catch (error) {
        console.log(error);
        throw "Failed to getDb";
    }

};

//----------------------------------- IMPLEMENTACION DE FUNCIONES AUXILIARES ---------------------------------------
//----------------------------------------------- DE CONSULTA -----------------------------------------------------

//Me aseguro de que el query y el query options sean objetos
const formatQuery = (query) => {
    try {
        query = query || {};
        if (typeof query === 'string') query = JSON.parse(query);
        console.log(query);
        return query;
    } catch (error) {
        console.log(error);
        return {};
    }
};

//TODO: reemplazar get y getcount por este metodo generico
function aggregate(database, collection, pipeline, options) {
    console.log(`mongo@aggregate: db: ${database} col: ${collection} pipeline: ${pipeline} options:${options}`);
    // pipeline = formatQuery(pipeline);
    //options = formatQuery(options);
    options.allowDiskUse = true; // con esto me deja hacer querys q usen mas de 100mb
    return new Promise((resolve, reject) => {
        getDb(database)
            .then((db) => {
                return db.collection(collection);
            })
            .then((col) => {
                return col.aggregate(JSON.parse(pipeline), { "allowDiskUse": true }).toArray();
            })
            .then((res) => {
                console.log(`mongo@aggregate: result: ${res}`);
                resolve(res);
            })
            .catch((err) => {
                console.log(`mongo@aggregate: error:${err}`);
                reject(err);
            });
    })
}

//U: guardar un documento en la colleccion 
const post = async (database, collection, document) => {
    try {
        console.log(`mongo@post: db: ${database} col: ${collection} doc: ${JSON.stringify(document)}`);
        var db = await getDb(database);
        var col = await db.collection(collection);
        if (typeof (document) === "object") {
            return col.insertOne(document);
        } else if (typeof (document) === "array") {
            return col.insertMany(document);
        } else {
            if (document) throw "mongoDbHelpers: error in document type: " + document.toString();
            else throw "mongoDbHelpers: error: document is null!";
        }
    } catch (error) {
        console.log(error);
        throw "Failed to post!";
    }




};

// Funcion que me devuelve un array de todos los elementos de la collecion que coinciden con el query
const get = async (database, collection, query, queryOptions) => {
    try {
        //console.log(`mongo@get: db: ${database} col: ${collection} q: ${query} qo:${queryOptions}`);
        query = formatQuery(query);
        queryOptions = formatQuery(queryOptions);

        var db = await getDb(database);
        var col = await db.collection(collection);
        var res = await col.find(query, queryOptions);
        //console.log(res);
        return res.toArray();
    } catch (error) {
        console.log(error);
        throw `Failed to get from: ${database}/${collection}`;
    }

};

const getById = async (database, collection, id) => {
    try {
        console.log(`mongo@getById: db: ${database} col: ${collection} id: ${id}`);
        var mongo = require('mongodb');
        var o_id = new mongo.ObjectID(id);
        var db = await getDb(database);
        var col = await db.collection(collection);
        res = await col.findOne(({ '_id': o_id }));
        return res;
    } catch (error) {
        console.log(error);
        throw `Failed to get by id from: ${database}/${collection}/${id}`;
    }

};

//FUNCION PARA ACTUALIZAR LOS VALORES DE UN DOCUMENTO
const updateOne = async (database, collection, document, query, options) => {
    try {
        console.log(`mongo@get: db: ${database} col: ${collection} q: ${query} qo:${options} updValues:${document}`);
        var query = formatQuery(query);
        var queryOptions = formatQuery(options);
        var document = formatQuery(document);

        let db = await getDb(database);
        let col = await db.collection(collection);
        let res = await col.updateOne(query, document, queryOptions);
        return res;
    } catch (err) {
        console.log(err);
        throw `Failed to update!`;
    }
};

const replaceOne = async (database, collection, document, query, queryOptions) => {
    try {
        //console.log(`mongo@Update: db: ${database} col: ${collection} q: ${query} qo: ${queryOptions}`);
        var query = formatQuery(query);
        var queryOptions = formatQuery(queryOptions);

        var db = await getDb(database);
        var col = await db.collection(collection);
        var res = await col.replaceOne(query, document, { upsert: true });
        return res;
    } catch (error) {
        console.log(error);
        throw `Failed to get from: ${database}/${collection}`;
    }


    // console.log(`mongo@Update: db: ${database} col: ${collection} q: ${query} values: ${updateValues}`);
    // query = formatQuery(query);
    // valuesToUpdate = formatQuery(updateValues); //$set operator PARA HACER UPDATE
    // return new Promise((resolve, reject) => {
    //     getDb(database)
    //         .then((db) => {
    //             return db.collection(collection);
    //         })
    //         .then((col) => { //TODO: VERIFICAR QUE LA QUERY TENGA LA ESTRUCTURA SIGUIENTE: updateOne(queryFilter, queryToUpdate) 
    //             //queryToUpdate es una expresión con el operador $set.
    //             return col.updateOne(query, valuesToUpdate); // {usuario: "Pepito"} , {$set: {codigos: [920,910]}}
    //         })
    //         .then((res) => {
    //             console.log(`mongo@update: result: ${res}`);
    //             resolve(res);
    //         })
    //         .catch((err) => {
    //             console.log(`mongo@update: error:${err}`);
    //             reject(err);
    //         })
    // });
};

// Funcion que me devuelve la cantidad de elementos de la collecion que coinciden con el query
function getCount(database, collection, query, queryOptions) {
    console.log(`mongo@getCount: db: ${database} col: ${collection} q: ${query} qo:${queryOptions}`);
    query = formatQuery(query);
    queryOptions = formatQuery(queryOptions);

    return new Promise((resolve, reject) => {
        getDb(database)
            .then((db) => {
                return db.collection(collection);
            })
            .then((col) => {
                return col.count(query, queryOptions);
            })
            .then((res) => {
                console.log(`mongo@getCount: result: ${res}`);
                resolve(res);
            })
            .catch((err) => {
                console.log(`mongo@getCount: error:${err}`);
                reject(err);
            });
    })
};

// Funcion que usamos para borrar un elemento de una bs/collection
const deleteOne = async (database, collection, query, queryOptions) => {
    try {
        console.log(`mongo@deleteOne: db: ${database} col: ${collection} q: ${query} qo:${queryOptions}`);
        query = formatQuery(query);
        queryOptions = formatQuery(queryOptions);

        var db = await getDb(database);
        var col = await db.collection(collection);
        var res = await col.deleteOne(query, queryOptions);
        return res;
    } catch (error) {
        console.log(error);
        throw `Failed to delete one from: ${database}/${collection}`;
    }
};

// Funcion que borra un elemento por id
const deleteById = async (database, collection, id) => {
    try {
        console.log(`mongo@deleteById: db: ${database} col: ${collection} id: ${id}`);
        var mongo = require('mongodb');
        var o_id = new mongo.ObjectID(id);
        var db = await getDb(database);
        var col = await db.collection(collection);
        res = await col.deleteOne({ '_id': o_id });
        return res;
    } catch (error) {
        console.log(error);
        throw `Failed to delete by id from: ${database}/${collection}/${id}`;
    }
};

// Funcion que usamos para borrar todos los elementos de una bs/collection
const deleteMany = async (database, collection, query, queryOptions) => {
    try {
        console.log(`mongo@deleteMany: db: ${database} col: ${collection} q: ${JSON.stringify(query)} qo:${JSON.stringify(queryOptions)}`);
        var db = await getDb(database);
        var col = await db.collection(collection);
        var res = await col.deleteMany(query, queryOptions);
        console.log(`Deleted docs: ${res.deletedCount}`);
        return res;
    } catch (error) {
        console.log(error);
        throw "Failed to deletmany!";
    }
};

// Interfaz con la bd de MongoDb
module.exports = { aggregate, post, get, getById, updateOne, replaceOne, getCount, deleteOne, deleteMany, deleteById }