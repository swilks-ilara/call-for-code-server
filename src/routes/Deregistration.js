import express from 'express';
import Registration from '../controllers/Registration.js';
import Api from "../controllers/Api";
import {ConsultationModel} from "../models";

const routes = express.Router();
routes.post('/patient_org', (req, res, next) => {
    const patientId = req.body.patient;
    const orgId = req.body.organization;
    res.set('Content-Type', 'application/json');
    Registration.deregisterPatientOrg(orgId, patientId)
        .then(docsOrError => {
            if (typeof docsOrError == 'string') {
                return Api.errorWithMessage(res, 400, docsOrError);
            } else if (Api.isError(docsOrError)) {
                return Api.errorWithMessage(res, 500, docsOrError.message + '\n' + docsOrError.stack);
            } else if (docsOrError instanceof Array && docsOrError.length === 1) {
                const patient = docsOrError[0];
                return Api.okWithContent(res,{ patient });
            } else if (docsOrError instanceof Array && docsOrError.length === 2) {
                const patient = docsOrError[0];
                const consultation = docsOrError[1];
                return Api.okWithContent(res, `{"patient": ${JSON.stringify(patient)}, "consultation": ${JSON.stringify(consultation)}}`);
            }
            return Api.errorWithMessage(res, 500, 'An error has occurred.')
        }).catch((error) => {
            return Api.errorWithMessage(res, 500, error.message + '\n' + error.stack)
        });
    });
routes.post('/patient_practitioner', (req, res, next) => {
    const patientId = req.body.patient;
    const practitionerId = req.body.practitioner; // optional, only set if coming from practitioner/socket side
    res.set('Content-Type', 'application/json');
    Registration.deregisterPatientPractitioner(practitionerId, patientId)
        .then(consultationOrError => {
            if (Api.isError(consultationOrError)) {
                return Api.errorWithMessage(res, 500, consultationOrError.message + '\n' + consultationOrError.stack);
            } else if(!consultationOrError) {
                return Api.okWithMessage(res,'patient was not registered to practitioner. No updates performed.');
            } else if (consultationOrError instanceof ConsultationModel) {
                const consultation = consultationOrError;
                return Api.okWithContent(res, { consultation });
            }
            return Api.errorWithMessage(res, 500, 'An error has occurred.')
        }).catch((error) => {
            return Api.errorWithMessage(res, 500, error.message + '\n' + error.stack)
        });
});

export default routes;
