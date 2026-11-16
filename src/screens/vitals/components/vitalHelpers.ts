import { DateTimeUtils } from '../../../utils';

export const formatVitalDateTime = (dateStr?: string, timeStr?: string) => {
  const dFormatted = dateStr ? DateTimeUtils.getDataFormat(dateStr) : '';
  const tFormatted = timeStr ? DateTimeUtils.formatTimeToAmPm(timeStr) || timeStr : '';
  if (dFormatted && tFormatted) return `${dFormatted}, ${tFormatted}`;
  if (dFormatted) return dFormatted;
  if (tFormatted) return tFormatted;
  return '--';
};
