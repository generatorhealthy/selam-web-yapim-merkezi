
// Utility functions for doctor name URL handling
export const createDoctorSlug = (name: string): string => {
  // Remove all titles/prefixes and dots, then convert to URL-friendly format
  const cleanName = name
    .replace(/Prof\.\s*Dr\.\s*/gi, '')
    .replace(/Dr\.\s*/gi, '')
    .replace(/Dan\.\s*/gi, '')
    .replace(/Uzm\.\s*/gi, '')
    .replace(/Doç\.\s*/gi, '')
    .replace(/\./g, '');
  
  // Turkish character mapping
  const turkishCharMap: { [key: string]: string } = {
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'I': 'I',
    'İ': 'i', 'i': 'i',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C'
  };
  
  // Replace Turkish characters
  let slug = cleanName;
  Object.keys(turkishCharMap).forEach(turkishChar => {
    slug = slug.replace(new RegExp(turkishChar, 'g'), turkishCharMap[turkishChar]);
  });
  
  return slug
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const createSpecialtySlug = (specialty: string): string => {
  // Turkish character mapping
  const turkishCharMap: { [key: string]: string } = {
    'ğ': 'g', 'Ğ': 'G',
    'ü': 'u', 'Ü': 'U',
    'ş': 's', 'Ş': 'S',
    'ı': 'i', 'I': 'I',
    'İ': 'i', 'i': 'i',
    'ö': 'o', 'Ö': 'O',
    'ç': 'c', 'Ç': 'C'
  };
  
  // Replace Turkish characters
  let slug = specialty;
  Object.keys(turkishCharMap).forEach(turkishChar => {
    slug = slug.replace(new RegExp(turkishChar, 'g'), turkishCharMap[turkishChar]);
  });
  
  return slug
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const findDoctorBySlug = (doctors: any[], slug: string) => {
  return doctors.find(doctor => createDoctorSlug(doctor.name) === slug);
};
