export const isValidEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isValidPhone = (phone) =>
  /^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''));

export const isValidPincode = (pin) => /^\d{6}$/.test(pin);

export const isStrongPassword = (pw) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw);

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  if (!email)                errors.email    = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email';
  if (!password)             errors.password = 'Password is required';
  return errors;
};

export const validateRegisterForm = ({ name, email, phone, password }) => {
  const errors = {};
  if (!name || name.trim().length < 2) errors.name = 'Enter your full name';
  if (!email)                          errors.email = 'Email is required';
  else if (!isValidEmail(email))       errors.email = 'Enter a valid email';
  if (!phone)                          errors.phone = 'Phone number is required';
  else if (!isValidPhone(phone))       errors.phone = 'Enter a valid 10-digit mobile number';
  if (!password)                       errors.password = 'Password is required';
  else if (!isStrongPassword(password))
    errors.password = 'Min 8 chars, 1 uppercase, 1 number';
  return errors;
};

export const validateAddressForm = (form) => {
  const errors = {};
  if (!form.label?.trim())         errors.label       = 'Label is required (Home / Work)';
  if (!form.addressLine1?.trim())  errors.addressLine1 = 'Address is required';
  if (!form.city?.trim())          errors.city        = 'City is required';
  if (!form.state?.trim())         errors.state       = 'State is required';
  if (!isValidPincode(form.pincode)) errors.pincode   = 'Enter a valid 6-digit pincode';
  return errors;
};
