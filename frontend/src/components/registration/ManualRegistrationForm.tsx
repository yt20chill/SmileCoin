'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { ArrowLeft, Plane, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isValidEmail, isValidFlightNumber } from '@/lib/utils/validation';
import type { User } from '@/lib/types';

interface ManualRegistrationFormProps {
  onSubmit: (userData: Partial<User>) => void;
  onBack: () => void;
}

interface FormData {
  flightNumber: string;
  arrivalDate: string;
  email: string;
  preferredLanguage: 'en' | 'zh-TW';
}

interface FormErrors {
  flightNumber?: string;
  arrivalDate?: string;
  email?: string;
}

export function ManualRegistrationForm({ onSubmit, onBack }: ManualRegistrationFormProps) {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  
  const [formData, setFormData] = useState<FormData>({
    flightNumber: '',
    arrivalDate: '',
    email: '',
    preferredLanguage: 'en',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Flight number validation
    if (!formData.flightNumber.trim()) {
      newErrors.flightNumber = 'Flight number is required';
    } else if (!isValidFlightNumber(formData.flightNumber)) {
      newErrors.flightNumber = tErrors('invalidFlightNumber');
    }

    // Arrival date validation
    if (!formData.arrivalDate) {
      newErrors.arrivalDate = 'Arrival date is required';
    } else {
      const selectedDate = new Date(formData.arrivalDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.arrivalDate = 'Arrival date cannot be in the past';
      }
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userData: Partial<User> = {
        flightNumber: formData.flightNumber.toUpperCase(),
        arrivalDate: new Date(formData.arrivalDate),
        email: formData.email || undefined,
        preferredLanguage: formData.preferredLanguage,
      };
      
      onSubmit(userData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Flight Number */}
      <div className="space-y-2">
        <Label htmlFor="flightNumber" className="flex items-center gap-2">
          <Plane className="h-4 w-4" />
          {t('flightNumber')}
        </Label>
        <Input
          id="flightNumber"
          type="text"
          placeholder="e.g., CX123"
          value={formData.flightNumber}
          onChange={(e) => handleInputChange('flightNumber', e.target.value)}
          className={errors.flightNumber ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.flightNumber && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {errors.flightNumber}
          </motion.p>
        )}
      </div>

      {/* Arrival Date */}
      <div className="space-y-2">
        <Label htmlFor="arrivalDate" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t('arrivalDate')}
        </Label>
        <Input
          id="arrivalDate"
          type="date"
          min={today}
          value={formData.arrivalDate}
          onChange={(e) => handleInputChange('arrivalDate', e.target.value)}
          className={errors.arrivalDate ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.arrivalDate && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {errors.arrivalDate}
          </motion.p>
        )}
      </div>

      {/* Email (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          {t('email')}
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@example.com"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={errors.email ? 'border-destructive' : ''}
          disabled={isSubmitting}
        />
        {errors.email && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-destructive"
          >
            {errors.email}
          </motion.p>
        )}
      </div>

      {/* Language Selection */}
      <div className="space-y-2">
        <Label>Preferred Language</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={formData.preferredLanguage === 'en' ? 'default' : 'outline'}
            onClick={() => handleInputChange('preferredLanguage', 'en')}
            disabled={isSubmitting}
            className="flex-1"
          >
            English
          </Button>
          <Button
            type="button"
            variant={formData.preferredLanguage === 'zh-TW' ? 'default' : 'outline'}
            onClick={() => handleInputChange('preferredLanguage', 'zh-TW')}
            disabled={isSubmitting}
            className="flex-1"
          >
            中文
          </Button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tCommon('back')}
        </Button>
        
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? 'Registering...' : t('register')}
        </Button>
      </div>
    </motion.form>
  );
}