// controllers/predictController.js
const { getModelInfo, predict } = require("../services/tfModelService");
const Prediccion=require("../models/prediction")

function health(req, res) {
  res.json({
    status: "ok",
    service: "predict"
  });
}

function ready(req, res) {
  const info = getModelInfo();

  if (!info.ready) {
    return res.status(503).json({
      ready: false,
      modelVersion: info.modelVersion,
      message: "Model is still loading"
    });
  }

  res.json({
    ready: true,
    modelVersion: info.modelVersion
  });
}

async function doPredict(req, res) {
  const start = Date.now();

  try {
    const info = getModelInfo();
    if (!info.ready) {
      return res.status(503).json({
        error: "Model not ready",
        ready: false
      });
    }

    const { features, meta } = req.body;

    if (!features) {
      return res.status(400).json({ error: "Missing features" });
    }
    if (!meta || typeof meta !== "object") {
      return res.status(400).json({ error: "Missing meta object" });
    }

    const { featureCount } = meta;

    if (featureCount !== info.inputDim) {
      return res.status(400).json({
        error: `featureCount must be ${info.inputDim}, received ${featureCount}`
      });
    }

    if (!Array.isArray(features) || features.length !== info.inputDim) {
      return res.status(400).json({
        error: `features must be an array of ${info.inputDim} numbers`
      });
    }

    const prediction = await predict(features);
    const latencyMs = Date.now() - start;
    const timestamp = new Date().toISOString();
     
    const prediccion = await Prediccion.create({
      features,
      prediction,
      timestamp,
      latencyMs,
      meta
    })

// --- ZONA DE DEPURACIÓN (CHIVATOS) ---
    console.log("--------------------------------------------------");
    console.log("1. Resultado numérico (prediction):", prediction);
    console.log("2. Objeto guardado en BD (prediccion):", prediccion);
    console.log("3. ID que vamos a enviar:", prediccion._id);
    console.log("--------------------------------------------------");

    res.status(201).json({
      predictionId: prediccion._id,
      prediction,
      timestamp,
      latencyMs
    });
  } catch (err) {
    console.error("Error en /predict:", err);
    res.status(500).json({ error: "Internal error" });
  }
}

module.exports = {
  health,
  ready,
  doPredict
};
