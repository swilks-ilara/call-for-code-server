import express from 'express';
import Registration from '../controllers/Registration.js';
import TestDataCreator from "../controllers/TestDataCreator";
import Api from "../controllers/Api";

const routes = express.Router();
routes.post('/patient_org', (req, res, next) => {
    const orgId = req.body.organization;
    const patientId = req.body.patient;
    res.set('Content-Type', 'application/json');
    Registration.registerPatientOrg(orgId, patientId)
        .then((patientOrError) => {
            if (Api.isError(patientOrError)) {
                return Api.errorWithMessage(res, 500, patientOrError.message + '\n' + patientOrError.stack);
            } else if (patientOrError) {
                return Api.okWithContent(res,{ patient: patientOrError });
            }
            return Api.errorWithMessage(res, 500, 'An error has occurred.')
        }).catch((error) => {
        return Api.errorWithMessage(res, 500, error.message + '\n' + error.stack)
    });
});
routes.post('/patient_practitioner', (req, res, next) => {
    const patientId = req.body.patient;
    const practitionerId = req.body.practitioner;
    res.set('Content-Type', 'application/json');
    Registration.registerPatientPractitioner(practitionerId, patientId)
        .then((consultationOrError) => {
            if (Api.isError((consultationOrError))) {
                return Api.errorWithMessage(res, 500, consultationOrError.message + '\n' + consultationOrError.stack);
            } else if (typeof consultationOrError == 'string') {
                return Api.errorWithMessage(res, 400, consultationOrError);
            } else if (consultationOrError) {
                const consultation = consultationOrError; //rename for easier json creation
                return Api.okWithContent(res, { consultation });
            }
            return Api.errorWithMessage(res, 500, 'An error has occurred.')
        }).catch((error) => {
        return Api.errorWithMessage(res, 500, error.message + '\n' + error.stack)
    });
});

export default routes;
