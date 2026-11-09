import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getSpecialistConsultation } from './specialistConsultation';

test('online-only specialists do not advertise face-to-face cities', () => {
  assert.deepEqual(getSpecialistConsultation({ online_consultation: true, face_to_face_consultation: false, city: 'İstanbul' }), {
    online: true, faceToFace: false, faceToFaceCity: null,
  });
});

test('face-to-face specialists retain all recorded cities', () => {
  assert.deepEqual(getSpecialistConsultation({ online_consultation: false, face_to_face_consultation: true, city: ' İstanbul / Sakarya ' }), {
    online: false, faceToFace: true, faceToFaceCity: 'İstanbul / Sakarya',
  });
});

test('specialists offering both modes retain both availability flags and city', () => {
  assert.deepEqual(getSpecialistConsultation({ online_consultation: true, face_to_face_consultation: true, city: 'Ankara' }), {
    online: true, faceToFace: true, faceToFaceCity: 'Ankara',
  });
});

test('missing availability and city are not inferred', () => {
  assert.deepEqual(getSpecialistConsultation({ online_consultation: null, face_to_face_consultation: null, city: 'İzmir' }), {
    online: false, faceToFace: false, faceToFaceCity: null,
  });
  assert.equal(getSpecialistConsultation({ online_consultation: false, face_to_face_consultation: true, city: ' ' }).faceToFaceCity, null);
});