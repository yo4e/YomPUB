import { defineConfig, devices } from '@playwright/test';
const localURL=`http://127.0.0.1:${process.env.PORT ?? 4178}${process.env.BASE_PATH ?? '/'}`;
const remoteURL=process.env.YOMPUB_BASE_URL;
if (remoteURL && !/^https?:\/\/.+\/$/.test(remoteURL)) throw new Error('YOMPUB_BASE_URL must be an http(s) URL ending in /.');
export default defineConfig({
  testDir:'tests/browser', timeout:30000, fullyParallel:false, workers:1,
  reporter:[['list'],['json',{outputFile:'evidence/browser-results.json'}]],
  use:{ baseURL:remoteURL ?? localURL, trace:'retain-on-failure', screenshot:'only-on-failure', headless:true },
  projects:[
    {name:'chromium-desktop', use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
    {name:'chromium-mobile', use:{...devices['Pixel 7'],viewport:{width:390,height:844}}},
    {name:'webkit-desktop', use:{...devices['Desktop Safari'],viewport:{width:1440,height:1000}}}
  ],
  webServer:remoteURL ? undefined : {command:'npm run dev',url:localURL,reuseExistingServer:!process.env.CI,timeout:20000}
});
