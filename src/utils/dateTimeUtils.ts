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
      case 3: return 'March';
      case 4: return 'April';
      case 5: return 'May';
      case 6: return 'June';
      case 7: return 'July';
      case 8: return 'Aug';
      case 9: return 'Sep';
      case 10: return 'Oct';
      case 11: return 'Nov';
      case 12: return 'Dec';
      default: return '';
    }
  }

  /**
   * Safely formats date strings (e.g. "2026-07-28", "2026-07-28T00:00:00.000Z")
   * into "28 July, 2026" without timezone shifting.
   */
  static getDataFormat(createdAt?: string): string {
    if (!createdAt) return '';
    const str = String(createdAt).trim();
    const cleanDate = str.split('T')[0].split(' ')[0];
    const parts = cleanDate.split('-');

    if (parts.length >= 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const day = parseInt(parts[2], 10);
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        return `${day} ${DateTimeUtils.getMonthName(month)}, ${year}`;
      }
    }

    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return createdAt;
    return `${date.getDate()} ${DateTimeUtils.getMonthName(date.getMonth() + 1)}, ${date.getFullYear()}`;
  }

  /**
   * Safely formats a timestamp (e.g. "2026-07-22T14:18:35.000Z")
   * into "22 July, 2026 02:18 PM".
   */
  static getDataFormatWithTime(createdAt?: string): string {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) return DateTimeUtils.getDataFormat(createdAt);

    const dateStr = DateTimeUtils.getDataFormat(createdAt);
    const timeStr = DateTimeUtils.convertTo12HourFormat(
      `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
    );
    return `${dateStr} ${timeStr}`.trim();
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
}
