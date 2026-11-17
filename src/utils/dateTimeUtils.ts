export const isWithinLast7Days = (dateStr?: string | null): boolean => {
  if (!dateStr) return false;
  const str = String(dateStr).trim();
  if (!str || str === 'null' || str === 'undefined') return false;

  const cleanDate = str.split('T')[0].split(' ')[0];
  const parts = cleanDate.split('-');
  let itemDate: Date;
  if (parts.length >= 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      itemDate = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      itemDate = new Date(dateStr);
    }
  } else {
    itemDate = new Date(dateStr);
  }

  if (isNaN(itemDate.getTime())) return false;

  const now = new Date();
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
  const sevenDaysAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 0, 0, 0, 0);

  return itemDate.getTime() >= sevenDaysAgo.getTime() && itemDate.getTime() <= endOfToday.getTime();
};

/**
 * Safely parses any vital item's date and time (supporting both 12-hour AM/PM and 24-hour formats)
 * into a full epoch millisecond timestamp. Preserves created_at sub-second precision to break
 * ties between entries logged within the same minute.
 */
export const getVitalTimestamp = (item: any): number => {
  if (!item) return 0;

  const dateStr = item.date ? String(item.date).split('T')[0] : '';
  const timeStr = item.time ? String(item.time).trim() : '';

  if (dateStr) {
    const dateParts = dateStr.split('-');
    if (dateParts.length >= 3) {
      const year = parseInt(dateParts[0], 10);
      const month = parseInt(dateParts[1], 10) - 1;
      const day = parseInt(dateParts[2], 10);

      let hour = 0;
      let minute = 0;
      let second = 0;

      if (timeStr) {
        const isPM = /pm/i.test(timeStr);
        const isAM = /am/i.test(timeStr);
        const cleanTime = timeStr.replace(/[^\d:]/g, '');
        const timeParts = cleanTime.split(':');

        let h = parseInt(timeParts[0], 10);
        let m = parseInt(timeParts[1], 10);
        let s = parseInt(timeParts[2], 10);

        if (!isNaN(h)) {
          if (isPM && h < 12) h += 12;
          else if (isAM && h === 12) h = 0;
          hour = h;
        }
        if (!isNaN(m)) minute = m;
        if (!isNaN(s)) second = s;
      }

      // If created_at exists, preserve seconds and milliseconds to ensure precise sub-minute ordering
      if (item.created_at) {
        const cat = new Date(item.created_at);
        if (!isNaN(cat.getTime())) {
          if (second === 0) second = cat.getSeconds();
          const ms = cat.getMilliseconds();
          const d = new Date(year, month, day, hour, minute, second, ms);
          if (!isNaN(d.getTime())) return d.getTime();
        }
      }

      const d = new Date(year, month, day, hour, minute, second);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }

  if (item.created_at) {
    const t = new Date(item.created_at).getTime();
    if (!isNaN(t)) return t;
  }

  return 0;
};

/**
 * Sorts vitals chronologically in descending order (newest first).
 * Uses exact timestamp with created_at and ID tie-breakers so all screens sort consistently.
 */
export const sortVitalsDescending = <T = any>(list: T[]): T[] => {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a: any, b: any) => {
    const dtA = getVitalTimestamp(a);
    const dtB = getVitalTimestamp(b);
    if (dtB !== dtA && !isNaN(dtB) && !isNaN(dtA)) {
      return dtB - dtA;
    }
    const catA = a?.created_at ? new Date(a.created_at).getTime() : 0;
    const catB = b?.created_at ? new Date(b.created_at).getTime() : 0;
    if (catB !== catA && !isNaN(catB) && !isNaN(catA)) {
      return catB - catA;
    }
    const idA = Number(a?.id);
    const idB = Number(b?.id);
    if (!isNaN(idA) && !isNaN(idB) && idB !== idA) {
      return idB - idA;
    }
    return String(b?.id ?? '').localeCompare(String(a?.id ?? ''), undefined, { numeric: true });
  });
};

export class DateTimeUtils {
  static getDayName(day: number): string {
    switch (day) {
      case 1: return 'Monday';
      case 2: return 'Tuesday';
      case 3: return 'Wednesday';
      case 4: return 'Thursday';
      case 5: return 'Friday';
      case 6: return 'Saturday';
      case 7: return 'Sunday';
      default: return '--';
    }
  }

  static getMonthName(monthCode: number): string {
    switch (monthCode) {
      case 1: return 'Jan';
      case 2: return 'Feb';
      case 3: return 'Mar';
      case 4: return 'Apr';
      case 5: return 'May';
      case 6: return 'Jun';
      case 7: return 'Jul';
      case 8: return 'Aug';
      case 9: return 'Sep';
      case 10: return 'Oct';
      case 11: return 'Nov';
      case 12: return 'Dec';
      default: return '';
    }
  }

  /** Placeholder shown by every Date of Birth field (testing report 05/11/26, item 40). */
  static readonly DOB_PLACEHOLDER = 'DD/MM/YYYY';

  /**
   * Formats a stored DOB ("2026-07-28" / ISO string) as DD/MM/YYYY without
   * timezone shifting. Returns '' for empty and the raw value if unparsable.
   */
  static formatDob(dob?: string | null): string {
    if (!dob) return '';
    const str = String(dob).trim();
    const clean = str.split('T')[0].split(' ')[0];
    const separator = clean.includes('-') ? '-' : clean.includes('/') ? '/' : '';
    if (separator) {
      const parts = clean.split(separator);
      if (parts.length >= 3) {
        if (parts[0].length === 4) {
          const [y, m, d] = parts;
          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        } else if (parts[2].length === 4) {
          const [d, m, y] = parts;
          return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
        }
      }
    }
    return str;
  }

  /**
   * Consistently formats date strings across the application into "25 Aug, 2026".
   * Safely handles "YYYY-MM-DD", "DD/MM/YYYY", "YYYY/MM/DD", ISO timestamps,
   * without timezone shifting bugs.
   */
  static getDataFormat(createdAt?: string | null): string {
    if (!createdAt) return '';
    const str = String(createdAt).trim();
    if (!str || str === 'null' || str === 'undefined') return '';

    const cleanDate = str.split('T')[0].split(' ')[0];

    // Check for delimiter '-' or '/'
    if (cleanDate.includes('-') || cleanDate.includes('/')) {
      const separator = cleanDate.includes('-') ? '-' : '/';
      const parts = cleanDate.split(separator);

      if (parts.length >= 3) {
        // Case 1: YYYY-MM-DD or YYYY/MM/DD
        if (parts[0].length === 4) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const day = parseInt(parts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return `${day} ${DateTimeUtils.getMonthName(month)}, ${year}`;
          }
        }
        // Case 2: DD-MM-YYYY or DD/MM/YYYY or D/M/YYYY
        if (parts[2].length === 4) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
            return `${day} ${DateTimeUtils.getMonthName(month)}, ${year}`;
          }
        }
      }
    }

    const date = new Date(str);
    if (isNaN(date.getTime())) return str;
    return `${date.getDate()} ${DateTimeUtils.getMonthName(date.getMonth() + 1)}, ${date.getFullYear()}`;
  }

  /**
   * Consistently formats a timestamp across the application into "25 Aug, 2026, 03:00 PM".
   */
  static getDataFormatWithTime(createdAt?: string | null): string {
    if (!createdAt) return '';
    const str = String(createdAt).trim();
    if (!str || str === 'null' || str === 'undefined') return '';

    const dateStr = DateTimeUtils.getDataFormat(str);
    const date = new Date(str);

    if (!isNaN(date.getTime()) && str.includes(':')) {
      const hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const timeStr = DateTimeUtils.convertTo12HourFormat(`${hours}:${minutes}`);
      return `${dateStr}, ${timeStr}`.trim();
    }

    // Check for time after space or 'T'
    if (str.includes(' ') || str.includes('T')) {
      const timePart = str.split(/[ T]/)[1];
      if (timePart && timePart.includes(':')) {
        const timeStr = DateTimeUtils.formatTimeToAmPm(timePart);
        if (timeStr) {
          return `${dateStr}, ${timeStr}`.trim();
        }
      }
    }

    return dateStr;
  }

  /**
   * Converts 24-hour time strings (e.g. "10:00:00", "08:10:00", "14:30")
   * into 12-hour AM/PM format (e.g. "10:00 AM", "08:10 AM", "02:30 PM").
   */
  static convertTo12HourFormat(time24: string): string {
    if (!time24) return '';
    const str = String(time24).trim();
    if (/am|pm/i.test(str)) return str;

    const parts = str.split(':');
    if (parts.length < 2) return str;

    let hour = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (isNaN(hour) || isNaN(minute)) return str;

    const period = hour < 12 ? 'AM' : 'PM';
    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;

    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
  }

  static formatTimeToAmPm(time24?: string): string {
    return DateTimeUtils.convertTo12HourFormat(time24 ?? '');
  }

  static getTodayDateInString(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  static isWithinLast7Days(dateStr?: string | null): boolean {
    return isWithinLast7Days(dateStr);
  }
}
