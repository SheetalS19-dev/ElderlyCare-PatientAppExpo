/**
 * Formats a user model or object into a standardized full name.
 */
export const getUserFullName = (user: any): string => {
  if (!user) return '';
  if (typeof user === 'string') return user.trim();
  const fName = user.f_name || user.firstName || user.first_name || '';
  const lName = user.l_name || user.lastName || user.last_name || '';
  const full = `${fName} ${lName}`.trim();
  if (full) return full;
  return user.name || user.full_name || user.phone || '';
};

/**
 * Returns capitalized initials for a user name (e.g. "Amit Chauhan" -> "AC" or "A").
 */
export const getUserInitials = (nameOrUser: any, singleLetter = true): string => {
  const fullName = typeof nameOrUser === 'string' ? nameOrUser.trim() : getUserFullName(nameOrUser);
  if (!fullName) return 'U';
  const parts = fullName.split(/\s+/).filter(Boolean);
  if (singleLetter || parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
};

/**
 * Formats an amount as Indian Rupee currency (e.g. ₹500 or ₹1,200.00).
 */
export const formatCurrency = (amount: number | string | null | undefined, includeDecimals = false): string => {
  if (amount == null || amount === '') return '₹0';
  const numeric = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9.-]/g, ''));
  if (isNaN(numeric)) return '₹0';
  if (includeDecimals) {
    return `₹${numeric.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${Math.round(numeric).toLocaleString('en-IN')}`;
};

/**
 * Formats a 10-digit phone number with ISD dial code.
 */
export const formatPhoneWithIsd = (phone?: string | null, isd = '+91'): string => {
  if (!phone) return '';
  const clean = String(phone).replace(/\D/g, '');
  if (clean.length === 10) {
    return `${isd} ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return `${isd} ${phone}`;
};

/**
 * Computes human-readable age from a date of birth string.
 * Handles ISO dates, YYYY-MM-DD, DD/MM/YYYY, and infant ages (< 1 Yr).
 */
export const calculateAgeFromDob = (dobString?: string | null): string => {
  if (!dobString || dobString === 'N/A' || dobString === 'null' || dobString === 'undefined') return 'N/A';
  const cleanStr = String(dobString).trim().split('T')[0].split(' ')[0];
  let birthDate: Date;

  if (cleanStr.includes('-')) {
    const parts = cleanStr.split('-');
    if (parts.length === 3 && parts[0].length === 4) {
      birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      birthDate = new Date(cleanStr);
    }
  } else if (cleanStr.includes('/')) {
    const parts = cleanStr.split('/');
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
      } else if (parts[0].length === 4) {
        birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      } else {
        birthDate = new Date(cleanStr);
      }
    } else {
      birthDate = new Date(cleanStr);
    }
  } else {
    birthDate = new Date(cleanStr);
  }

  if (isNaN(birthDate.getTime())) return 'N/A';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age > 0 && age < 125) return `${age} Yrs`;
  if (age === 0) return '< 1 Yr';
  return 'N/A';
};
