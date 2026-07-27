# Analisis Pengembangan Statelite

## Ringkasan

Statelite saat ini adalah external store TypeScript yang sangat kecil dengan empat
operasi utama: `getState`, `setState`, `subscribe`, dan `select`. Bentuk dasar ini
cocok dijadikan core yang framework-agnostic, tetapi versi sekarang belum siap
dipakai secara konsisten di semua framework frontend atau pada aplikasi production
berskala besar.

Rekomendasi utama adalah memisahkan:

1. **Core store murni** tanpa dependency browser atau framework.
2. **Plugin opsional** untuk persistence, middleware, devtools, dan sinkronisasi.
3. **Adapter tipis** untuk React, Vue, Svelte, Solid, Angular, dan framework lain.

Dengan desain tersebut, framework baru dapat didukung melalui adapter tanpa
mengubah core.

## Kondisi Saat Ini

### Kekuatan

- API kecil dan mudah dipahami.
- State dan updater sudah menggunakan generic TypeScript.
- `subscribe` mengembalikan fungsi unsubscribe.
- Tidak bergantung pada lifecycle suatu framework.
- Ukuran paket hasil `npm pack` sangat kecil.

### Masalah Prioritas Tinggi

1. **Persistence terikat browser**

   `js-cookie` di-import langsung dari entry point. Akibatnya core tidak benar-benar
   bebas platform dan berpotensi menyulitkan SSR, React Server Components, worker,
   React Native, serta runtime non-DOM.

2. **Cookie bukan default storage yang ideal**

   Seluruh state dikirim bersama request HTTP, kapasitasnya kecil, dan JSON state
   tidak memiliki versioning, migration, serializer, error handling, atau opsi
   keamanan. Cookie juga tidak bisa dibuat `HttpOnly` dari JavaScript.

3. **Selector belum reaktif**

   `select` hanya membaca nilai sekali. Ia tidak memberi mekanisme subscription
   berdasarkan slice, equality function, atau pencegahan render yang tidak perlu.

4. **Semantik update terbatas**

   `setState` selalu melakukan shallow merge dan hanya menerima `Partial<T>`.
   Belum ada replace, reset resmi, batch, transaction, action, atau dukungan state
   non-object.

5. **Notifikasi belum aman**

   Listener disimpan di array, dapat didaftarkan ganda, dan mutasi subscription saat
   iterasi dapat menghasilkan perilaku sulit diprediksi. Listener juga selalu
   dipanggil meskipun state efektif tidak berubah.

6. **Mutability**

   `getState` mengembalikan object internal secara langsung. Konsumen dapat mengubah
   state tanpa melewati `setState`, sehingga notification dan persistence terlewati.

7. **SSR dan hydration belum lengkap**

   Pemeriksaan `window` hanya mencegah akses cookie di server. Belum ada API untuk
   membuat store per request, mengambil server snapshot, hydrate state, atau
   menangani mismatch server-client.

8. **Distribusi package belum modern**

   Paket hanya menghasilkan CommonJS ES6. Belum ada `exports` map, ESM build,
   conditional exports, `sideEffects`, sourcemap, atau deklarasi subpath.

9. **Tidak ada test aktif**

   `npm test` gagal dengan `No tests found`. Test lama justru dihapus pada commit
   terakhir, dan setup Jest masih me-mock `localStorage` meskipun implementasi sudah
   pindah ke cookie.

10. **Repository hygiene buruk**

    `node_modules` dan `dist` masuk Git, tidak ada `.gitignore`, dan README yang
    tercantum di `files` tidak tersedia.

11. **Publishing berisiko**

    GitHub Actions menjalankan `npm publish` pada setiap push ke `main`, menggunakan
    action versi lama, `npm install` alih-alih `npm ci`, dan tidak memiliki lint,
    test, pack check, release tag, provenance, atau version gate.

12. **Deskripsi tidak sesuai implementasi**

    `package.json` menjanjikan middleware support, tetapi source saat ini tidak
    menyediakan API middleware.

## Arsitektur Target

### 1. Core

Package: `@statelite/core`

Core tidak boleh mengakses `window`, cookie, local storage, DOM, atau API framework.
Dependency runtime idealnya nol.

API minimum:

```ts
type SetState<T> = (
  update: T | Partial<T> | ((state: Readonly<T>) => T | Partial<T>),
  options?: { replace?: boolean; action?: string }
) => void;

interface Store<T> {
  getState(): Readonly<T>;
  getInitialState(): Readonly<T>;
  setState: SetState<T>;
  reset(): void;
  subscribe(listener: (state: T, previous: T) => void): () => void;
  subscribe<U>(
    selector: (state: T) => U,
    listener: (slice: U, previous: U) => void,
    options?: { equality?: (a: U, b: U) => boolean; fireImmediately?: boolean }
  ): () => void;
  destroy(): void;
}
```

Implementasi internal sebaiknya:

- memakai `Set` untuk listener;
- memakai `Object.is` sebagai equality default;
- mengambil snapshot listener sebelum notification;
- mendukung shallow merge dan explicit replace;
- menjaga initial state secara stabil;
- menyediakan batching/transaction sebagai fitur core atau plugin kecil;
- tidak memaksakan deep clone karena mahal dan mengubah semantik object.

Immutability perlu menjadi kontrak API dan dapat dibantu freeze pada development
build. Integrasi Immer sebaiknya plugin opsional, bukan dependency core.

### 2. Plugin System

Package opsional:

- `@statelite/persist`
- `@statelite/devtools`
- `@statelite/history`
- `@statelite/sync`
- `@statelite/immer`

Plugin menggunakan lifecycle terdefinisi, misalnya `onInit`, `beforeSet`,
`afterSet`, dan `onDestroy`. Error pada satu plugin tidak boleh merusak daftar
listener atau meninggalkan transaction setengah jalan.

Persistence harus menerima adapter:

```ts
interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}
```

Adapter resmi dapat mencakup `localStorage`, `sessionStorage`, cookie client,
IndexedDB, AsyncStorage, dan custom server storage. Fitur persistence perlu
`partialize`, `version`, `migrate`, `merge`, custom serializer, hydration status,
TTL, serta recovery dari data korup/quota error.

### 3. Framework Adapters

Core external-store contract dapat dipakai langsung oleh JavaScript vanilla.
Adapter resmi menerjemahkannya ke primitive reaktif masing-masing framework:

| Package | Primitive integrasi |
| --- | --- |
| `@statelite/react` | `useSyncExternalStore`, selector, server snapshot |
| `@statelite/vue` | `shallowRef`/`computed`, scope disposal |
| `@statelite/svelte` | kontrak readable store `{ subscribe }` |
| `@statelite/solid` | signal/store bridge dengan fine-grained selector |
| `@statelite/angular` | Signal atau Observable bridge dan DI provider |
| `@statelite/preact` | `useSyncExternalStore` compat |
| `@statelite/qwik` | serializable state bridge; hindari closure non-serializable |
| `@statelite/lit` | reactive controller |

Untuk framework yang belum memiliki package resmi, dokumentasikan adapter contract:

```ts
interface FrameworkAdapter<TSelected> {
  read(): TSelected;
  subscribe(onChange: () => void): () => void;
}
```

Target realistis bukan membuat adapter khusus untuk setiap framework yang pernah
ada, melainkan menyediakan core standar, adapter untuk framework utama, dan resep
integrasi singkat bagi framework lainnya.

### 4. Package Layout

Monorepo direkomendasikan:

```text
packages/
  core/
  persist/
  devtools/
  react/
  vue/
  svelte/
  solid/
  angular/
examples/
  vanilla/
  react-next/
  vue-nuxt/
  sveltekit/
  solid-start/
  angular/
```

Gunakan workspaces dan satu pipeline test lint/build. `peerDependencies` hanya
berada di adapter framework sehingga pengguna core tidak mengunduh React/Vue/etc.

## Kapabilitas agar “Powerful”

Prioritas fitur sebaiknya tetap menjaga core kecil:

- selector reaktif dan custom equality;
- typed actions serta action names;
- middleware/plugin lifecycle;
- persistence adapter + migration;
- SSR snapshot, hydration, dan store factory per request;
- batching dan transaction;
- derived/computed state;
- async action tanpa memaksakan format tertentu;
- optimistic update dan rollback helper;
- devtools, state inspection, time travel;
- cross-tab sync melalui `BroadcastChannel`;
- lazy store/slice dan code splitting;
- testing utilities;
- debug build terpisah dari production build.

Hindari memasukkan router, data fetching, form management, atau server cache ke
core. Integrasi dengan domain tersebut lebih sehat sebagai plugin atau recipe.

## Build dan Compatibility

Rekomendasi distribusi:

- ESM sebagai jalur utama dan CJS selama masih diperlukan;
- `package.json` `exports` map untuk root dan subpath;
- declaration `.d.ts` per entry;
- target modern yang terdokumentasi;
- `sideEffects: false` jika semua entry benar-benar aman;
- sourcemap;
- ukuran bundle dan tree-shaking test;
- browser, Node SSR, worker, dan React Native compatibility test;
- satu instance core tidak boleh terduplikasi akibat kondisi ESM/CJS.

Contoh arah metadata:

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "sideEffects": false
}
```

Compatibility sebaiknya diuji melalui fixture aplikasi nyata, bukan hanya unit
test. Setidaknya lakukan build dan runtime smoke test untuk Vite, Next.js, Nuxt,
SvelteKit, Angular, dan satu runtime non-browser.

## Quality dan Release

Minimum quality gate:

- unit test untuk update, replace, reset, unsubscribe, re-entrancy, equality,
  selector, dan error listener;
- type tests untuk inference dan invalid usage;
- contract test yang dijalankan ulang pada semua adapter;
- SSR/hydration tests;
- persistence sync/async, migration, dan corrupt payload tests;
- bundle-size budget;
- `npm pack` content test;
- API Extractor atau equivalent untuk mendeteksi perubahan public API.

Release sebaiknya berbasis tag/changeset:

1. Pull request menjalankan lint, typecheck, test, build, examples, dan pack check.
2. Changeset menentukan versi setiap package.
3. Merge menghasilkan release PR.
4. Publish hanya dari release/tag dengan npm trusted publishing/provenance.

## Roadmap

### Fase 0 — Stabilkan repository

- Tambahkan `.gitignore`; hentikan tracking `node_modules`.
- Pulihkan README dan test.
- Ubah CI ke `npm ci`; jangan publish pada setiap push.
- Dokumentasikan API dan browser/runtime support.
- Putuskan strategi kompatibilitas untuk versi 1.x.

### Fase 1 — Core 2.0

- Ekstrak semua persistence dari core.
- Definisikan contract store dan semantik update.
- Tambahkan selector subscription, equality, reset, replace, dan destroy.
- Siapkan build ESM/CJS/types dan test matrix.
- Publish prerelease untuk validasi API.

### Fase 2 — Adapter utama

- React + Next.js.
- Vue + Nuxt.
- Svelte + SvelteKit.
- Solid dan Angular.
- Vanilla guide dan adapter authoring guide.

### Fase 3 — Ekosistem

- Persistence dengan migration dan async storage.
- Devtools dan history.
- Cross-tab sync.
- Immer serta testing utilities.
- Benchmarks dan compatibility fixtures.

## Urutan Implementasi yang Disarankan

1. Hygiene, test, dan release safety.
2. Contract core yang stabil.
3. Selector + SSR semantics.
4. React/Vue/Svelte adapters.
5. Persistence plugin.
6. Solid/Angular dan framework lain.
7. Devtools, history, sync, serta optimasi performa.

Kesuksesan sebaiknya diukur dengan contract correctness, ukuran core, waktu update,
jumlah render yang dihindari oleh selector, compatibility matrix, kualitas type
inference, dan kemampuan upgrade tanpa breaking change—bukan dari banyaknya fitur
yang dimasukkan ke core.
