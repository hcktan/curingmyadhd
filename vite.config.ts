import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    // CSS küçültülmez: küçültücü (Lightning CSS) `backdrop-filter` ile `-webkit-backdrop-filter` çiftini
    // tek bir `-webkit-` bildirimine indiriyor; Chromium bunu tanımadığı için cam bulanıklığı kayboluyor.
    // CSS kaynak sürümle birebir aynı kalsın diye olduğu gibi paketlenir.
    cssMinify: false,
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});
