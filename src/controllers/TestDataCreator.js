import {PatientModel, PractitionerModel, OrganizationModel} from '../models/index.js';
import mongoose from "mongoose";
import {ConsultationModel} from "../models/index";
import {Roles} from "../models/index";


class TestDataCreator {

  // can only be run once if using hardcoded ids
  static createTestData() {
    const orgId2 = mongoose.Types.ObjectId('678df3efb618f5141202a191');
    const practId3 = mongoose.Types.ObjectId('c78df3efb618f5141202a191');
    this.createOrg(orgId2, 'ORG2');
    this.createPractitioner(practId3,'pract3', orgId2, Roles.ClinicalOfficer);  
  }

  static getPatientFromId(req, res, next) {
      try {
        const patientId = req.body.id;
        PatientModel.findById(patientId,
            function (err, patient) {
              if (err) return console.log(`ERROR :(((: ${err}`);
              if (patient == null) return res.status(200).send(`NOT FOUND :(`);
              return res.status(200).send(patient);
            })
      } catch (error) {
        return next(error);
      }
  }

  static createPatient(id, firstName, phone_number, orgId ){
    console.log("Creating patient with name " + firstName + " and phone number " + phone_number)
    const patient = PatientModel({
      _id: id,
      name: {
        first_name : firstName,
        last_name : 'Patient'
      },
      phone_number: phone_number,
      organization: orgId
    })
    this.defaultDocSave(patient)
  }

  static createOrg(id, name){
    const org = OrganizationModel({
      _id : id,
      name : name,
      phone_number : '456',
      location: null
    })
    this.defaultDocSave(org)
  }

  static createPractitioner(id, firstName, orgId, role){
    const practitioner = PractitionerModel({
      _id : id,
      name : {
        first_name : firstName,
        last_name : 'Med',
        prefix : ''
      },
      organization : orgId,
      phone_number : '123',
      role : role
    })
    this.defaultDocSave(practitioner)
  }

  static createConsultation(id, patientId, practId, orgId, active) {
    const consultation = ConsultationModel({
      practitioner : practId,
      organization : orgId, //Somewhat breaking SSoT here, but it's going to be very expensive to query for all messages for an organization if we don't include
      patient : patientId,
      active : active,
      messages : []
    })
    this.defaultDocSave(consultation)
  }

  static defaultDocSave(document) {
    document.save((err) => {
      if (err) throw err;
      console.log(`SAVE SUCCESSFUL, id: ${document.id}`)
    });
  }
}

export default TestDataCreator;
