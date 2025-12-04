// server.js
// Entry point del servicio PREDICT

require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose"); //Importamos mongoose 
const prediction = require('./models/prediction'); //Importamos prediction
const predictRoutes = require("./routes/predictRoutes");
const { initModel } = require("./services/tfModelService");

// variables de entorno
const PORT = process.env.PORT || 3002;
const MODEL_VERSION = process.env.MODEL_VERSION || "v1.0"; 
const app = express();

// 1. Conectar a MongoDB
// Leemos la URI del entorno o usamos localhost como fallback
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/producto';

try {
  mongoose.connect(mongoUri); // Usamos la variable
  console.log('Conexión a la base de datos establecida en:', mongoUri); 
} catch (err) {
  console.error('Error de conexión a la base de datos:', err); 
}

app.use(express.json());

// Servir la carpeta del modelo TFJS (model/model.json + pesos)
const modelDir = path.resolve(__dirname, "model");
app.use("/model", express.static(modelDir));

// Rutas del servicio PREDICT
app.use("/", predictRoutes);

// ==========================================
// RUTAS CRUD PARA predictionS (MongoDB)
// ==========================================

// 1. GET: Obtener todos los predictions
app.get('/api/prediction', async (req, res) => {
    try {
        const predictions = await prediction.find({});
        res.status(200).send({ predictions });
    } catch (err) {
        res.status(500).send({ mensaje: `Error al realizar la petición: ${err}` });
    }
});

// 2. GET: Obtener un prediction por ID
app.get('/api/prediction/:id', async (req, res) => {
    let predictionId = req.params.id;
    try {
        const prediction = await prediction.findById(predictionId);
        if (!prediction) {
            return res.status(404).send({ mensaje: 'El prediction no existe' });
        }
        res.status(200).send({ prediction });
    } catch (err) {
        res.status(500).send({ mensaje: `Error al realizar la petición: ${err}` });
    }
});

// 3. POST: Crear un nuevo prediction
app.post('/api/prediction', async (req, res) => {
    console.log('POST /api/prediction');
    console.log(req.body);

    let prediction = new prediction(req.body);

    try {
        const predictionStored = await prediction.save();
        res.status(200).send({ prediction: predictionStored });
    } catch (err) {
        res.status(500).send({ mensaje: `Error al salvar en la base de datos: ${err}` });
    }
});

// 4. PUT: Actualizar un prediction por ID
app.put('/api/prediction/:id', async (req, res) => {
    let predictionId = req.params.id;
    let update = req.body;

    try {
        // { new: true } hace que nos devuelva el objeto ya actualizado
        const predictionUpdated = await prediction.findByIdAndUpdate(predictionId, update, { new: true });
        
        if (!predictionUpdated) {
            return res.status(404).send({ mensaje: 'El prediction no existe' });
        }
        res.status(200).send({ prediction: predictionUpdated });
    } catch (err) {
        res.status(500).send({ mensaje: `Error al actualizar el prediction: ${err}` });
    }
});

// 5. DELETE: Borrar un prediction por ID
app.delete('/api/prediction/:id', async (req, res) => {
    let predictionId = req.params.id;

    try {
        const predictionDeleted = await prediction.findByIdAndDelete(predictionId);
        
        if (!predictionDeleted) {
            return res.status(404).send({ mensaje: 'El prediction no existe' });
        }
        res.status(200).send({ mensaje: 'El prediction ha sido eliminado', prediction: predictionDeleted });
    } catch (err) {
        res.status(500).send({ mensaje: `Error al borrar el prediction: ${err}` });
    }
});

// Arranque del servidor + carga del modelo + conexión BD
app.listen(PORT, async () => {
  const serverUrl = `http://localhost:${PORT}`;
  console.log(`[PREDICT] Servicio escuchando en ${serverUrl}`);


  // 2. Inicializar Modelo TF
  try {
    await initModel(serverUrl);
  } catch (err) {
    console.error("Error al inicializar modelo:", err);
    process.exit(1);
  }
});