

import type { Customer } from "../storage/customerStorage";
import type { StoredInvoice } from "../storage/invoiceStorage";
import {
  formatNumber,
  numberToPersianWords,
  toPersianDigits,
} from "../utils/invoiceHelpers";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const toNumber = (value: string | number | undefined): number => {
  if (value === undefined || value === "") return 0;
  const normalized = String(value)
    .replace(/,/g, "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * ساخت HTML فاکتور بر اساس مدل فعلی ذخیره‌سازی پروژه.
 * اطلاعات فروشنده و خریدار از snapshot ذخیره‌شده در خود فاکتور خوانده می‌شود.
 */
export const generateInvoiceHtml = (
  invoice: StoredInvoice,
  customer?: Customer,
): string => {
  const itemsHtml = (invoice.items ?? [])
    .map((item, index) => {
      const quantity = item.quantity === "" ? 1 : toNumber(item.quantity) || 1;
      const unitPrice = toNumber(item.unitPrice);
      const total = quantity * unitPrice;

      return `
        <tr>
          <td class="center">${toPersianDigits(index + 1)}</td>
          <td>${escapeHtml(item.desc)}</td>
          <td class="center">${toPersianDigits(quantity)}</td>
          <td class="number">${formatNumber(unitPrice)}</td>
          <td class="number strong">${formatNumber(total)}</td>
        </tr>`;
    })
    .join("");

  const sellerName = invoice.sellerName ?? "";
  const sellerPhone = invoice.sellerPhone ?? "";
  const sellerAddress = invoice.sellerAddress ?? "";
  const sellerEconomicCode = invoice.sellerEconomicCode ?? "";
  const buyerName = invoice.buyerName ?? customer?.name ?? "";
  const buyerPhone = invoice.buyerPhone ?? customer?.phone ?? "";
  const buyerAddress = invoice.buyerAddress ?? customer?.address ?? "";
  const buyerEconomicCode =
    invoice.buyerEconomicCode ?? customer?.economicCode ?? "";
  const amount = toNumber(invoice.amount);

  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: Tahoma, sans-serif; direction: rtl; color: #1e293b; margin: 0; padding: 20px; font-size: 13px; }
    .header { width: 100%; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
    .header td { width: 33%; vertical-align: middle; }
    .title { font-size: 20px; font-weight: bold; color: #1e3a8a; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; background: #dbeafe; color: #1e40af; font-weight: bold; }
    .parties { display: flex; width: 100%; margin-bottom: 16px; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
    .party { box-sizing: border-box; width: 50%; padding: 12px; background: #f8fafc; line-height: 2; }
    .party + .party { border-right: 1px solid #e2e8f0; }
    .party-title { font-weight: bold; margin-bottom: 6px; color: #2563eb; }
    table.items { width: 100%; border-collapse: collapse; margin: 10px 0 20px; }
    .items th { background: #f1f5f9; padding: 10px; border: 1px solid #cbd5e1; }
    .items td { padding: 8px; border: 1px solid #cbd5e1; }
    .center { text-align: center; }
    .number { text-align: left; direction: ltr; }
    .strong { font-weight: bold; }
    .summary { width: 100%; margin-top: 10px; }
    .summary td { padding: 8px; border: 1px solid #e2e8f0; }
    .total { background: #eff6ff; font-weight: bold; font-size: 15px; color: #1d4ed8; }
    .words { margin-top: 12px; padding: 10px; background: #fafaf9; border: 1px dashed #d6d3d1; border-radius: 6px; }
    .note { margin-top: 12px; line-height: 2; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <table class="header">
    <tr>
      <td><div class="title">${escapeHtml(sellerName)}</div><div>تلفن: ${toPersianDigits(escapeHtml(sellerPhone))}</div></td>
      <td class="center"><span class="badge">${escapeHtml(invoice.type)}</span></td>
      <td style="text-align:left"><div><strong>شماره فاکتور:</strong> ${toPersianDigits(escapeHtml(invoice.number))}</div><div>تاریخ: ${toPersianDigits(escapeHtml(invoice.date))}</div></td>
    </tr>
  </table>

  <div class="parties">
    <div class="party">
      <div class="party-title">فروشنده</div>
      <div>${escapeHtml(sellerName)}</div>
      <div>کد اقتصادی: ${toPersianDigits(escapeHtml(sellerEconomicCode || "-"))}</div>
      <div>نشانی: ${escapeHtml(sellerAddress || "-")}</div>
    </div>
    <div class="party">
      <div class="party-title">خریدار</div>
      <div>${escapeHtml(buyerName || "-")}</div>
      <div>شماره تماس: ${toPersianDigits(escapeHtml(buyerPhone || "-"))}</div>
      <div>کد اقتصادی / ملی: ${toPersianDigits(escapeHtml(buyerEconomicCode || "-"))}</div>
      <div>نشانی: ${escapeHtml(buyerAddress || "-")}</div>
    </div>
  </div>

  <table class="items">
    <thead><tr>
      <th style="width:40px">ردیف</th><th>شرح کالا / خدمات</th>
      <th style="width:90px">تعداد / مقدار</th><th style="width:120px">قیمت واحد (ریال)</th>
      <th style="width:140px">مبلغ کل (ریال)</th>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <table class="summary">
    <tr class="total"><td>مبلغ نهایی و قابل پرداخت:</td><td class="number">${formatNumber(amount)} ریال</td></tr>
  </table>
  <div class="words"><strong>مبلغ به حروف:</strong> ${numberToPersianWords(amount)}</div>
  ${invoice.note ? `<div class="note"><strong>توضیحات:</strong> ${escapeHtml(invoice.note)}</div>` : ""}
  <div class="footer">${escapeHtml(sellerPhone)}</div>
</body>
</html>`.trim();
};
