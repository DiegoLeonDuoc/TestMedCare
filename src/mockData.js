export const MOCK_PRESCRIPTIONS = [
    { id: 'p1', name: 'Amoxicilina 250mg', dosage: '1 tableta cada 8 horas por 7 días', date: '2024-05-20', doctor: 'Dra. Smith', notes: 'Completar el ciclo completo.' },
{ id: 'p2', name: 'Ibuprofeno 400mg', dosage: '1 tableta según necesidad para el dolor', date: '2024-05-15', doctor: 'Dr. Jones', notes: 'Máximo 3 tabletas al día.' },
];

export const MOCK_DOCTORS = [
    { id: 'doc1', name: 'Dra. Emily Carter (Cardióloga)' },
    { id: 'doc2', name: 'Dr. John Smith (Médico General)' },
    { id: 'doc3', name: 'Dra. Sarah Lee (Pediatra)' },
];

export const MOCK_LAB_RESULTS = [
    { id: 'lr1', testName: 'Hemograma Completo (HC)', date: '2024-05-18', status: 'Ver Resultados', summary: 'Todos los valores dentro del rango normal.', doctor: 'Dr. Smith' },
    { id: 'lr2', testName: 'Perfil Lipídico', date: '2024-05-10', status: 'Ver Resultados', summary: 'Colesterol LDL ligeramente elevado.', doctor: 'Dra. Carter' },
{ id: 'lr3', testName: 'Hormona Estimulante de la Tiroides (TSH)', date: '2024-04-20', status: 'Pendiente', summary: 'Resultados aún no disponibles.', doctor: 'Dr. endocrinólogo' },
];

export const MOCK_MEDICAL_HISTORY = {
    diagnoses: [
        { id: 'd1', condition: 'Hipertensión', date: '2022-01-15', notes: 'Controlada con medicación.' },
        { id: 'd2', condition: 'Alergias Estacionales', date: 'En curso', notes: 'Polen, ácaros del polvo.' },
    ],
    allergies: [
        { id: 'a1', substance: 'Penicilina', reaction: 'Erupción cutánea', severity: 'Leve' },
        { id: 'a2', substance: 'Maní', reaction: 'Anafilaxia', severity: 'Severa' },
    ],
    immunizations: [
        { id: 'i1', vaccine: 'Influenza', date: '2023-10-01' },
        { id: 'i2', vaccine: 'Tétanos, Difteria, Tos Ferina (Tdap)', date: '2020-07-20' },
    ]
};

export const MOCK_EDUCATIONAL_RESOURCES = [
    { id: 'er1', title: 'Entendiendo su Presión Arterial', type: 'Artículo', category: 'Salud Cardiovascular', summary: 'Aprenda sobre las lecturas y el manejo de la presión arterial.' },
{ id: 'er2', title: 'Manejo de la Diabetes Tipo 2', type: 'Video', category: 'Cuidado de la Diabetes', summary: 'Consejos para dieta, ejercicio y medicación.' },
{ id: 'er3', title: 'Resfriado Común: Síntomas y Tratamiento', type: 'Preguntas Frecuentes', category: 'Bienestar General', summary: 'Preguntas frecuentes sobre el resfriado común.' },
];

export const MOCK_CLINICS = [
    { id: 'c1', name: 'Hospital General de la Ciudad', address: '123 Calle Principal, Cualquier Ciudad', type: 'Hospital', specialties: ['Cardiología', 'Oncología', 'Pediatría'], insurance: ['Fonasa', 'Isapre'], rating: 4.5 },
{ id: 'c2', name: 'Atención de Urgencias Centro', address: '456 Avenida Roble, Cualquier Ciudad', type: 'Centro de Urgencias', specialties: ['Medicina General'], insurance: ['Isapre', 'Fonasa'], rating: 4.2 },
{ id: 'c3', name: 'Clínica Bienestar', address: '789 Camino Pino, Cualquier Ciudad', type: 'Clínica', specialties: ['Medicina Familiar', 'Pediatría'], insurance: ['Fonasa', 'Isapre'], rating: 4.8 },
];
