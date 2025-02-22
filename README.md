<h1 align="center">Build Tactical LLC</h1>

<p align="center">
 
</p>

## Features

- Works across the entire [Next.js](https://nextjs.org) stack
  - App Router
  - Pages Router
  - Middleware
  - Client
  - Server
- supabase-ssr for cookie-based auth
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Components with [shadcn/ui](https://ui.shadcn.com/)

## Quick Start

1. Set up your environment:
   - Copy `.env.example` to `.env.local`
   - Add your Supabase project URL and anon key from [your project's API settings](https://app.supabase.com/project/_/settings/api)
   - Add your EmailJS credentials for the contact form:
     ```
     NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
     NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_template_id
     NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
     ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

Visit [localhost:3000](http://localhost:3000/) to see your app.
