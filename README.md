# Mood Weather Journal

Build a responsive, modern mobile-first Web Application called "心情氣象台 (Mood Weather)". 

It is a therapeutic AI emotional venting and mood tracking app.

Key Requirements:

1. Tech Stack: React, Tailwind CSS, Lucide Icons, Shadcn UI components, Recharts for analytics.

2. Color Scheme: Deep soothing indigo and slate blue, with warm ambient accents (amber, soft sky blue).

3. Pages/Tabs:

   - Chat (`/chat`): Main venting screen with message list, text input, and a prominent "結束今日傾訴 (Finish Venting)" button.

   - Mood Rating Modal: Appears when finishing venting. Allows rating mood 1-10, displays matching weather SVG icon (Sunny, Cloudy, Rainy, Storm), and shows a therapeutic quote.

   - Calendar (`/calendar`): Interactive grid displaying monthly dates with recorded weather SVG icons on completed days.

   - Reports (`/reports`): Analytics dashboard with a score trend line chart, emotional stressor tags, AI recommendations, and a paywall banner for 30-day reports.

   - Settings (`/settings`): Theme controls, privacy policy, and emergency helpline card.

4. Data Persistence: Use localStorage / React State mocks for MVP so data stays across screen navigation.

5. Language: Use Traditional Chinese (繁體中文) for all UI labels, mock chats, and quotes.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/121c3b77-68b6-40a2-a6c0-c4c6fe202f5c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
