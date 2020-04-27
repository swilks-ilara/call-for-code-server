import {PatientModel} from '../models/index.js';
import {PractitionerModel} from '../models/index.js';
import {ConsultationModel} from '../models/index.js';
import Api from './Api'

//todo error check the input ex if patient doesnt exist or missing body components
/*
API:
* everything returns 200 for success (or no action taken).
* post to '/register/patient_org'
    body = {
      "organization": "String, org id",
      "patient": "String, patient id"
    }
    returns: {"patient": PatientModel}
* post to '/deregister/patient_org'
  body = {
    "patient": "String, patient id"
    "organization": "String, org id",
  }
  returns:
    - if organization was not registered to patient:
      STATUS 400, {"error": "patient id ${patientId} was not registered with organization ${orgId}"}
    - else if there was no active consultation:
      {"patient": PatientModel}
    - else:
      {"patient": PatientModel, "consultation": ConsultationModel}

* post to '/register/patient_practitioner'
  body = {
    "patient": "String, patient id",
    "practitioner": "String, practitioner id"
  }
  returns:
    - if patient and practitioner's organization don't match:
       STATUS 400, {"error": "patient org id ${patient.organization} does not match practitioner org id ${practitioner.organization}"}
    - else if patient had no active waiting room consultation:
      STATUS 400, {"error": "patient had no waiting room consultation."}
    - else if patient NOT already registered to a practitioner:
      {"consultation": ConsultationModel}
    - else
      STATUS 400, {"error": "Bad request: patient with id ${patientId} is already registered with practitioner id ${consultation.practitioner} on active consultation id ${consultation.id}. No updates were performed."}

* post to '/deregister/patient_practitioner'
  body = {
    "patient": "String, patient id",
    "practitioner": "String, practitioner id, optional -> set if coming from practitioner/socket side"
  }
  returns:
    - if patient had active consultation with practitioner:
    - {"consultation": ConsultationModel}
    - else:
      {"message": "patient was not registered to practitioner. No updates performed."}
 */

class Registration {

  static registerPatientOrg(orgId, patientId) {
    return PatientModel.findById(patientId).then((patient) => {
      patient.organization = orgId;
      return patient.save()
    }).then( patient => {
        return patient;
     }).catch (error => {
        return error;
    });
  }

  static deregisterPatientOrg(orgId, patientId) {
    let responsePatient;
    return PatientModel.findById(patientId).then((patient) => {
      if (patient.organization != orgId) {
        return `patient id ${patientId} was not registered with organization ${orgId}`; //400
      }
      patient.organization = null;
      return patient.save()
          .then(patient => {
            responsePatient = patient;
            return Registration.findActiveConsultation(patientId);
          }).then(consultation => {
            if (!consultation) {
              return [responsePatient]; //200
            }
            consultation.active = false;
            return consultation.save()
                .then(consultation => {
                  return [responsePatient, consultation];//200
                });
            });
    }).catch ((error) => {
      return error; //500
    });
  }

  static registerPatientPractitioner(practitionerId, patientId) {
    return Promise.all([Registration.findOrgIdFromPractitionerId(practitionerId),
      PatientModel.findById(patientId)]).then(([practitioner, patient]) => {
      if (practitioner.organization.toString() != patient.organization) {
        return `patient org id ${patient.organization} does not match practitioner org id ${practitioner.organization}` //400
      }
      return Registration.findActiveConsultation(patientId)
          .then(consultation => {
            if (consultation == null) {
              return 'patient had no waiting room consultation.'; //400
            } else if (consultation.practitioner) {
              return `patient with id ${patientId} is already registered with practitioner id ${consultation.practitioner} on active consultation id ${consultation.id}.`; //400
            }
            consultation.practitioner = practitionerId;
            return consultation.save()
                .then(consultation => {
                  return consultation; //200
                });
          });
    }).catch (error => {
      return error; // 500
    });
  }

  static deregisterPatientPractitioner(practitionerId, patientId) {
    return Registration.findActiveConsultation(patientId, practitionerId).then(consultation => {
      if (!consultation || !consultation.practitioner) {
        return null; //200
      }
      consultation.active = false;
      return consultation.save()
          .then((consultation) => {
            return consultation; //200
          });
    }).catch ((error) => {
      return error //500
    });
  }

  // helper methods

  static findActiveConsultation(patientId, practitionerId) {
    const query = !practitionerId ? { patient: patientId, active: true} : { patient: patientId, practitioner: practitionerId, active: true}
    return ConsultationModel.findOne(query, "organization practitioner active patient");
  }

  static findOrgIdFromPractitionerId(practitionerId) {
    return PractitionerModel.findById(practitionerId, "organization");
  }

  static defaultDocSave(document) {
    return document.save();
  }

}

export default Registration;
