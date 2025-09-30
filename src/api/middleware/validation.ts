import { Request, Response, NextFunction } from 'express';

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class RequestValidationError extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Request validation failed');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

// Validation helper functions
export const validateRequired = (value: any, fieldName: string): ValidationError | null => {
  if (value === undefined || value === null || value === '') {
    return {
      field: fieldName,
      message: `${fieldName} is required`
    };
  }
  return null;
};

export const validateString = (value: any, fieldName: string, minLength = 1, maxLength = 255): ValidationError | null => {
  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
      value
    };
  }
  
  if (value.length < minLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${minLength} characters long`,
      value
    };
  }
  
  if (value.length > maxLength) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${maxLength} characters long`,
      value
    };
  }
  
  return null;
};

export const validateNumber = (value: any, fieldName: string, min?: number, max?: number): ValidationError | null => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      value
    };
  }
  
  if (min !== undefined && num < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min}`,
      value
    };
  }
  
  if (max !== undefined && num > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${max}`,
      value
    };
  }
  
  return null;
};

export const validateDate = (value: any, fieldName: string): ValidationError | null => {
  const date = new Date(value);
  
  if (isNaN(date.getTime())) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid date`,
      value
    };
  }
  
  return null;
};

export const validateCountryCode = (value: any, fieldName: string): ValidationError | null => {
  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
      value
    };
  }
  
  // Basic country code validation (2-3 characters, uppercase)
  if (!/^[A-Z]{2,3}$/.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid country code (2-3 uppercase letters)`,
      value
    };
  }
  
  return null;
};

export const validateEthereumAddress = (value: any, fieldName: string): ValidationError | null => {
  if (typeof value !== 'string') {
    return {
      field: fieldName,
      message: `${fieldName} must be a string`,
      value
    };
  }
  
  // Basic Ethereum address validation
  if (!/^0x[a-fA-F0-9]{40}$/.test(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid Ethereum address`,
      value
    };
  }
  
  return null;
};

// Validation middleware factory
export const validateRequest = (validationRules: (body: any) => ValidationError[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationRules(req.body);
    
    if (errors.length > 0) {
      const validationError = new RequestValidationError(errors);
      next(validationError);
      return;
    }
    
    next();
  };
};

// Common validation rules
export const touristRegistrationValidation = (body: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate touristId
  const touristIdError = validateRequired(body.touristId, 'touristId') || 
                        validateString(body.touristId, 'touristId', 1, 100);
  if (touristIdError) errors.push(touristIdError);
  
  // Validate originCountry
  const originCountryError = validateRequired(body.originCountry, 'originCountry') || 
                            validateCountryCode(body.originCountry, 'originCountry');
  if (originCountryError) errors.push(originCountryError);
  
  // Validate arrivalDate
  const arrivalDateError = validateRequired(body.arrivalDate, 'arrivalDate') || 
                          validateDate(body.arrivalDate, 'arrivalDate');
  if (arrivalDateError) errors.push(arrivalDateError);
  
  // Validate departureDate
  const departureDateError = validateRequired(body.departureDate, 'departureDate') || 
                            validateDate(body.departureDate, 'departureDate');
  if (departureDateError) errors.push(departureDateError);
  
  // Validate date logic
  if (!arrivalDateError && !departureDateError) {
    const arrivalTime = new Date(body.arrivalDate).getTime();
    const departureTime = new Date(body.departureDate).getTime();
    
    if (arrivalTime >= departureTime) {
      errors.push({
        field: 'departureDate',
        message: 'Departure date must be after arrival date'
      });
    }
    
    if (arrivalTime > Date.now() + (30 * 24 * 60 * 60 * 1000)) { // 30 days in future
      errors.push({
        field: 'arrivalDate',
        message: 'Arrival date cannot be more than 30 days in the future'
      });
    }
  }
  
  return errors;
};

export const restaurantRegistrationValidation = (body: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate googlePlaceId
  const placeIdError = validateRequired(body.googlePlaceId, 'googlePlaceId') || 
                      validateString(body.googlePlaceId, 'googlePlaceId', 1, 200);
  if (placeIdError) errors.push(placeIdError);
  
  // Validate name
  const nameError = validateRequired(body.name, 'name') || 
                   validateString(body.name, 'name', 1, 200);
  if (nameError) errors.push(nameError);
  
  // Validate address
  const addressError = validateRequired(body.address, 'address') || 
                      validateString(body.address, 'address', 1, 500);
  if (addressError) errors.push(addressError);
  
  return errors;
};

export const coinTransferValidation = (body: any): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  // Validate touristId
  const touristIdError = validateRequired(body.touristId, 'touristId') || 
                        validateString(body.touristId, 'touristId', 1, 100);
  if (touristIdError) errors.push(touristIdError);
  
  // Validate restaurantId
  const restaurantIdError = validateRequired(body.restaurantId, 'restaurantId') || 
                           validateString(body.restaurantId, 'restaurantId', 1, 100);
  if (restaurantIdError) errors.push(restaurantIdError);
  
  // Validate amount
  const amountError = validateRequired(body.amount, 'amount') || 
                     validateNumber(body.amount, 'amount', 0.1, 3);
  if (amountError) errors.push(amountError);
  
  return errors;
};