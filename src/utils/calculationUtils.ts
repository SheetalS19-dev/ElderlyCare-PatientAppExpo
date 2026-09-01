export class CalculationUtils {
  static calculatePercentageOff(mrp?: number, price?: number): string {
    if (mrp != null && price != null && mrp > 0) {
      const difference = mrp - price;
      const per = (difference / mrp) * 100;
      return per.toFixed(2);
    }
    return '--';
  }

  static calculateDifferencePrice(mrp?: number, price?: number): string {
    if (mrp != null && price != null) {
      const difference = mrp - price;
      return difference.toString();
    }
    return '--';
  }

  static calculateTaxPrice(price?: number, tax?: number): string {
    if (tax != null && price != null) {
      const taxPrice = (price * tax) / 100;
      return taxPrice.toFixed(2);
    }
    return '--';
  }

  static calculateTotalPrice(price?: number, tax?: number, qty?: number): string {
    if (tax != null && price != null && qty != null) {
      const taxPrice = (price * tax) / 100;
      const totalPrice = (taxPrice + price) * qty;
      return totalPrice.toFixed(2);
    }
    return '--';
  }

  static calculateDiscountAmount(amount?: number | string, discount?: number | string, type?: string): number {
    const amt = Number(amount ?? 0);
    const disc = Number(discount ?? 0);
    if (type === 'percent' || type === 'percentage') {
      return (amt * disc) / 100;
    }
    return Math.min(amt, disc);
  }
}
