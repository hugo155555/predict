'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 1. DEFINICIÓN DEL ESQUEMA (BD)
// Definimos la estructura aquí para no crear archivos extra
const PredictionSchema = new Schema({
    features: { type: [Number], required: true }, // Entradas
    prediction: { type: Number, required: true }, // Resultado IA
    latencyMs: Number,                            // Tiempo de respuesta
    timestamp: { type: Date, default: Date.now }, // Fecha
    meta: Object,
    notes: String,
    correctedValue: Number
});

module.exports = mongoose.model('Prediction', PredictionSchema);