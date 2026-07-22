import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    use: {
        baseURL: 'http://127.0.0.1:5173',
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
    webServer: [
        {
            command: 'node src/server.js',
            url: 'http://127.0.0.1:3000',
            reuseExistingServer: !process.env.CI,
            stdout: 'pipe',
            stderr: 'pipe',
        },
        {
            command: 'npm run dev',
            url: 'http://127.0.0.1:5173',
            reuseExistingServer: !process.env.CI,
            stdout: 'pipe',
            stderr: 'pipe',
        }
    ],
});
