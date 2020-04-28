import { MessageModel, ConsultationModel, PractitionerModel, PatientModel} from "../models";

class ConsultationController {

    static getAllConsultations(practitionerId) {
        let cons_ = null
        return new Promise((resolve, reject ) => {
            PractitionerModel.findById(practitionerId)
            .then(practitioner => {
                if (!practitioner) reject(`Practitioner not found with id ${practitionerId}`)
                return ConsultationModel.find({ 
                    organization: practitioner.organization,
                    practitioner: { $in: [practitioner.id, null]},
                    messages: { $gt: [] }
                })},
                err => reject(err))
            .then(consultations => {
                cons_ = consultations;
                return Promise.all(consultations.map(c => PatientModel.findById(c.patient)))
            },
            err => reject(err))
            .then(
                patients => resolve(patients.map((p, i) => ({patient: p, consultation: cons_[i]}))),
                err => reject(err))
        })
    }

    static getConsultationById(practitionerId, consultationId) {
         return new Promise((resolve, reject ) => {
            PractitionerModel.findById(practitionerId)
            .then(practitioner => {
                if (!practitioner) reject(`Practitioner not found with id ${practitionerId}`)
                return ConsultationModel.findOne({ 
                    _id: consultationId,
                    organization: practitioner.organization,
                    practitioner: { $in: [practitioner.id, null]}
                })}, 
                err => reject(err))
            .then(
                consultation => resolve(consultation),
                err => reject(err))
        })
    }

    // Assumption the consultation already exists
    static saveMessage(data, consultationId) {
        return new Promise((resolve, reject) => {
        const { from, message, sent_ts} = data;
        const messageDoc = MessageModel({
            sent_ts,
            from,
            to: consultationId,
            content: { message }
        })

         ConsultationModel.findOneAndUpdate(
            {_id: consultationId}, 
            {$push: { messages: messageDoc }},
            {upsert: true})
        .then(() => resolve(messageDoc.toObject()))
        
        })
    }
}

export default ConsultationController;