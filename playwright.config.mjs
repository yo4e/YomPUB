import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir:'tests/browser', timeout:30000, fullyParallel:false, workers:1,
  reporter:[['list'],['json',{outputFile:'evidence/browser-results.json'}]],
  use:{ baseURL:'http://127.0.0.1:4178', trace:'retain-on-failure', screenshot:'only-on-failure', headless:true },
  projects:[
    {name:'chromium-desktop', use:{...devices['Desktop Chrome'],viewport:{width:1440,height:1000}}},
    {name:'chromium-mobile', use:{...devices['Pixel 7'],viewport:{width:390,height:844}}},
    {name:'webkit-desktop', use:{...devices['Desktop Safari'],viewport:{width:1440,height:1000}}}
  ],
  webServer:{command:'npm run dev',url:'http://127.0.0.1:4178',reuseExistingServer:!process.env.CI,timeout:20000}
});
