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

/**
 * Determines whether a given family member record corresponds to the logged-in user (Self).
 */
export const isUserSelfMember = (member: any, user: any): boolean => {
  if (!member) return false;
  if (member.is_self === true) return true;

  const rel = (member.relationship || member.relation || '').trim().toLowerCase();
  if (rel === 'self' || rel === 'patient' || rel === 'myself' || rel === 'me' || rel === 'primary') return true;

  const userId = String(user?.id ?? (user as any)?.user_id ?? '');
  const memberUserId = String(member.user_id ?? '');
  if (userId && memberUserId && memberUserId !== userId) {
    // This member belongs to a different user, cannot be self
    return false;
  }

  const userFName = (user?.f_name || user?.firstName || user?.first_name || '').trim().toLowerCase();
  const userLName = (user?.l_name || user?.lastName || user?.last_name || '').trim().toLowerCase();
  const memFName = (member?.f_name || member?.firstName || member?.first_name || '').trim().toLowerCase();
  const memLName = (member?.l_name || member?.lastName || member?.last_name || '').trim().toLowerCase();

  const userPhone = String(user?.phone || '').replace(/\D/g, '').slice(-10);
  const memPhone = String(member?.phone || '').replace(/\D/g, '').slice(-10);

  // If first name matches
  if (userFName && memFName === userFName) {
    // And phone matches (last 10 digits)
    if (userPhone && memPhone && userPhone === memPhone) {
      return true;
    }
    // Or last name matches (or one is empty) and relationship is self/patient/generic
    if (userLName === memLName || !memLName || !userLName) {
      if (!rel || rel === 'self' || rel === 'patient' || rel === 'account holder' || rel === 'family member') {
        if (!memPhone || !userPhone || memPhone === userPhone) {
          return true;
        }
      }
    }
  }

  // If same phone number and generic/empty relationship
  if (userPhone && memPhone && userPhone === memPhone) {
    if (!rel || rel === 'self' || rel === 'patient' || rel === 'account holder' || rel === 'family member') {
      return true;
    }
  }

  return false;
};
