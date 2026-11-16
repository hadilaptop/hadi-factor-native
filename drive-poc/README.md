# Hadifactor Drive POC

نمونه مستقل برای بررسی اتصال Google Drive در Expo SDK 58. این پروژه به App.tsx، دیتابیس SQLite یا تنظیمات برنامه اصلی دست نمی‌زند.

## قابلیت آزمون
- ورود Native با حساب Google در Android
- درخواست scope محدود `drive.file`
- پیدا/ساخت پوشه قابل مشاهده `HadiFactor`
- ساخت فایل JSON آزمایشی در پوشه
- دانلود مجدد و مقایسه محتوای فایل
- نمایش فهرست فایل‌ها
- لغو مجوز Google بدون حذف فایل‌های Drive

هیچ داده واقعی مشتری یا فاکتور در این نمونه استفاده نمی‌شود.

## پیش‌نیاز Google Cloud
1. یک Google Cloud project آزمایشی جدا از پروژه تولیدی بسازید.
2. Google Drive API را فعال کنید.
3. OAuth consent screen را با نام آزمایشی تکمیل کنید.
4. یک OAuth Client از نوع Android بسازید:
   - Package: `com.hadifactordrivepoc`
   - SHA-1 برای debug keystore فعلی:
     `11:A3:60:41:46:2A:28:B5:AD:B0:A5:5C:67:CE:83:27:DF:03:36:19`
5. یک OAuth Client از نوع Web application بسازید و شناسه آن را در `.env` قرار دهید.
6. در OAuth consent screen، scope زیر را اضافه کنید:
   `https://www.googleapis.com/auth/drive.file`
7. تا پیش از Verification، حساب‌های آزمایشی را در Test users قرار دهید.

**نکته:** شناسه Web Client یک مقدار عمومی است؛ Client Secret را هرگز داخل برنامه قرار ندهید. از پروژه OAuth تولیدی Hadex یا کلیدهای برنامه اصلی برای این آزمایش استفاده نکنید.

## نصب و اجرا در Windows CMD
از پوشه `drive-poc`:

```cmd
copy .env.example .env
notepad .env
npm install
npx expo install expo-dev-client expo-secure-store
npx expo prebuild
npx expo run:android
```

در `.env` مقدار `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` را با شناسه Web Client جایگزین کنید.

این کتابخانه به کد Native نیاز دارد و در Expo Go اجرا نمی‌شود؛ باید Development Build نصب شود. اجرای `prebuild` فقط داخل همین پوشه مستقل انجام شود.

## هشدار فنی
نسخه رایگان عمومی `@react-native-google-signin/google-signin` روی Android از SDK قدیمی Google Sign-In استفاده می‌کند که Deprecated شده اما هنوز کار می‌کند. این PoC برای اثبات جریان مجوز Drive و عملیات فایل است؛ انتخاب نهایی روش احراز هویت تولیدی باید با توجه به Google Credential Manager و گزینه‌های بدون هزینه دوباره تأیید شود. هیچ‌یک از این کدها بدون بررسی و تأیید جداگانه وارد برنامه اصلی نمی‌شود.

## گزارش اجرای نمونه — ۱۴۰۵/۰۸/۲۵

### موفق
- نصب وابستگی‌های نمونه با npm انجام شد.
- `npx expo install --check`: وابستگی‌ها سازگار و به‌روز تشخیص داده شدند.
- `npm run typecheck`: موفق.
- `npx expo config --type public`: موفق؛ package اندروید `com.hadifactordrivepoc`.
- `npx expo prebuild --platform android`: موفق و پوشه native مستقل `android` ساخته شد.
- `npx expo export --platform android`: موفق؛ Metro بسته Android را تولید کرد.

### متوقف‌شده / نیازمند پیش‌نیاز
- `gradlew.bat assembleDebug`: در مرحله resolve وابستگی Expo Gradle Plugin متوقف شد؛ مخزن Google Maven برای `com.android.tools.build:gradle:9.2.1` پاسخ HTTP 404 داد. این خطا پیش از کامپایل اپ رخ داد و هنوز خطای کد برنامه محسوب نمی‌شود.
- ADB اجرا شد اما هیچ دستگاه Android متصل/قابل شناسایی نبود؛ بنابراین نصب و اجرای واقعی روی گوشی انجام نشد.
- OAuth و Drive API هنوز قابل آزمایش نیستند؛ شناسه‌های OAuth پروژه Google Cloud تنظیم نشده‌اند و حساب تست نیز معرفی نشده است.
- `npm audit` سه آسیب‌پذیری با شدت Moderate گزارش کرد. `npm audit fix --force` اجرا نشد چون پیشنهاد می‌داد Expo به نسخه ناسازگار 52 تنزل کند.

### اطلاعات لازم برای ادامه آزمایش واقعی
- ساخت OAuth Client نوع Android با package و SHA-1 بخش پیش‌نیاز.
- ساخت OAuth Client نوع Web و قرار دادن Web Client ID در فایل محلی `.env`.
- فعال‌کردن Google Drive API و اضافه‌کردن حساب آزمایش به Test users در صورت قرار داشتن Consent Screen در حالت Testing.
- اتصال گوشی اندرویدی با USB debugging و اطمینان از شناسایی آن توسط ADB.

**نتیجه:** نمونه مستقل آماده بررسی TypeScript و بسته‌بندی JavaScript است؛ آزمون واقعی ورود Google و عملیات Drive هنوز انجام نشده است. این نمونه از نسخه رایگان عمومی کتابخانه Google Sign-In استفاده می‌کند که در Android بر SDK قدیمی Deprecated متکی است؛ برای تولید نهایی باید روش مجاز و بدون هزینه مبتنی بر Google Credential Manager ارزیابی شود.
