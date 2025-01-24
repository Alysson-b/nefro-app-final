const mongoose = require('mongoose');

const ProgressoSchema = new mongoose.Schema({
    testId: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Simulado',
        required: true
    },
    userId: {
        type: String,
        required: true
    },
    ultimaQuestao: {
        type: Number,
        default: 0
    },
    respostas: [
        {
            questao_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Questao' },
            resposta: String
        }
    ],
    status: {
        type: String,
        enum: ['em_andamento', 'finalizado'],
        default: 'em_andamento'
    }
});

module.exports = mongoose.model('Progresso', ProgressoSchema);
