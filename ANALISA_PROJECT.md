# Analisa Project - Token via Query Parameter

## Status Saat Ini

### ✅ Yang Sudah Benar
1. **middleware.ts** - Sudah simplified, hanya redirect dengan query parameter
2. **components/deposit/DepositForm.tsx** - Sudah simplified, hanya baca dari query parameter

### ❌ Masalah yang Ditemukan

#### 1. Masalah Redirect (CRITICAL)
- **Issue**: Setelah redirect, path jadi kosong lagi
- **Root Cause**: Redirect tidak preserve path dengan benar
- **Location**: `middleware.ts` line 63
- **Fix**: Gunakan `request.nextUrl.pathname` untuk preserve path

#### 2. Kode yang Tidak Konsisten (CLEANUP NEEDED)

**A. app/layout.tsx**
- ❌ Masih menggunakan `AuthProvider` dari `contexts/AuthContext.tsx`
- ❌ Masih menggunakan `AuthProviderComponent` dari `components/auth/AuthProvider.tsx`
- ❌ Masih menggunakan `TokenScript` dari `components/auth/TokenScript.tsx`
- ✅ Hanya perlu `FeesProvider` saja

**B. contexts/AuthContext.tsx**
- ❌ Masih punya banyak fallback logic (cookies, headers, API endpoints)
- ❌ Tidak digunakan lagi karena token hanya dari query parameter
- ✅ Bisa dihapus atau di-simplify menjadi hanya baca dari query parameter

**C. components/auth/AuthProvider.tsx**
- ❌ Masih punya logic kompleks untuk cookies, headers, API endpoints
- ❌ Tidak digunakan lagi
- ✅ Bisa dihapus

**D. components/auth/TokenScript.tsx**
- ❌ Menggunakan sessionStorage yang tidak diperlukan lagi
- ❌ Tidak digunakan lagi
- ✅ Bisa dihapus

**E. app/api/deposit/create/route.ts**
- ❌ Masih punya fallback logic untuk cookies (line 30-52)
- ❌ Masih check Authorization header dari request (line 17-28)
- ✅ Hanya perlu baca dari `body.auth_token` saja

**F. lib/api.ts**
- ❌ Masih import `getAuthToken` dari `lib/auth.ts` (line 4) tapi tidak digunakan
- ✅ Hapus import yang tidak digunakan

**G. lib/auth.ts**
- ❌ Masih punya logic untuk sessionStorage, postMessage
- ❌ Tidak digunakan lagi karena token hanya dari query parameter
- ✅ Bisa dihapus atau di-simplify

**H. app/api/auth/get-token/route.ts**
- ❌ Tidak diperlukan lagi karena token hanya dari query parameter
- ✅ Bisa dihapus (optional, bisa tetap untuk debugging)

**I. app/api/auth/token-script/route.ts**
- ❌ Tidak diperlukan lagi
- ✅ Bisa dihapus

## Rencana Perbaikan

### Priority 1: Fix Redirect Issue (CRITICAL)
1. Fix `middleware.ts` untuk preserve path dengan benar

### Priority 2: Cleanup Kode (IMPORTANT)
1. Simplify `app/layout.tsx` - hapus AuthProvider, AuthProviderComponent, TokenScript
2. Simplify atau hapus `contexts/AuthContext.tsx`
3. Hapus `components/auth/AuthProvider.tsx`
4. Hapus `components/auth/TokenScript.tsx`
5. Simplify `app/api/deposit/create/route.ts` - hanya baca dari body
6. Clean up `lib/api.ts` - hapus import yang tidak digunakan
7. Simplify atau hapus `lib/auth.ts`

## Alur yang Seharusnya (Simplified)

1. **Android WebView** → Mengirim Authorization header
2. **Middleware** → Menangkap header, redirect ke URL yang sama dengan `?authToken="ENC Key=..."`
3. **Frontend (DepositForm)** → Baca token dari query parameter
4. **DepositForm onSubmit** → Inject token ke body request sebagai `auth_token`
5. **API Route (/api/deposit/create)** → Baca token dari `body.auth_token`, forward ke backend

## File yang Perlu Diubah

1. ✅ `middleware.ts` - Fix redirect
2. ✅ `app/layout.tsx` - Remove AuthProvider components
3. ✅ `app/api/deposit/create/route.ts` - Simplify, hanya baca dari body
4. ✅ `lib/api.ts` - Remove unused import
5. ⚠️ `contexts/AuthContext.tsx` - Optional: bisa dihapus atau simplify
6. ⚠️ `components/auth/AuthProvider.tsx` - Optional: bisa dihapus
7. ⚠️ `components/auth/TokenScript.tsx` - Optional: bisa dihapus
8. ⚠️ `lib/auth.ts` - Optional: bisa dihapus atau simplify

