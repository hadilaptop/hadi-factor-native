import { formatNumber, parseNumber, toPersianDigits, convertNumberToPersianWords } from './numberUtils';
import { Customer } from '../storage/customerStorage';

export { formatNumber, parseNumber, toPersianDigits, parseNumber as parseNumberValue };

export const numberToPersianWords = convertNumberToPersianWords;

// تبدیل تاریخ میلادی به شمسی بدون هیچ وابستگی خارجی
// (الگوریتم استاندارد gregorian → jalali)
function gregorianToJalali(gy: number, gm: number, gd: number) {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let jy = gy <= 1600 ? 0 : 979;
  gy -= gy <= 1600 ? 621 : 1600;
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd +
    g_d_m[gm - 1];
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  jy += Math.floor((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export const getCurrentPersianDate = (): string => {
  const now = new Date();
  const { jy, jm, jd } = gregorianToJalali(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );
  const mm = String(jm).padStart(2, '0');
  const dd = String(jd).padStart(2, '0');
  return toPersianDigits(`${jy}/${mm}/${dd}`);
};

export const getCustomerCode = (
  customer: Customer,
  customers: Customer[] = []
): number => {
  if (typeof customer.customerCode === 'number') {
    return customer.customerCode;
  }

  const index = customers.findIndex(
    (item) => String(item.id) === String(customer.id)
  );

  return index >= 0 ? index + 1001 : 1001;
};
