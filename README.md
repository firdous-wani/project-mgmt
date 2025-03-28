# Project Management Application

A modern, full-stack project management application built with Next.js, tRPC, and Tailwind CSS. This application helps teams collaborate effectively by managing projects, tasks, and team members in a user-friendly interface.

## Features

- 🔐 Authentication with NextAuth.js
- 📊 Project management with status tracking
- ✅ Task management with priorities and due dates
- 👥 Team collaboration with role-based access
- 🎨 Modern UI with Tailwind CSS
- ⚡ Real-time updates with tRPC
- 📱 Responsive design for all devices

## Tech Stack

- **Frontend:**

  - Next.js 13+ (App Router)
  - React
  - Tailwind CSS
  - Headless UI
  - Heroicons
  - React Hot Toast

- **Backend:**

  - tRPC
  - Prisma
  - PostgreSQL
  - NextAuth.js

- **Testing:**
  - Vitest
  - React Testing Library
  - MSW (Mock Service Worker)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/project-mgmt.git
   cd project-mgmt
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```env

   ```

AUTH_DISCORD_ID=""
AUTH_DISCORD_SECRET=""

NEXT_PUBLIC_APP_URL="http://localhost:3000"

#in case you want to use a local db
DATABASE_URL_LOCAL="postgresql://postgres:password@localhost:5432/project-mgmt"
DATABASE_URL=""
#Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""

#RESEND API KEY FROM RESEND DASHBOARD
RESEND_API_KEY=""

````

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
````

5. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
project-mgmt/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Next.js pages
│   ├── server/           # Backend code
│   │   ├── api/         # tRPC routers
│   │   └── db/          # Database models and migrations
│   ├── styles/          # Global styles
│   ├── utils/           # Utility functions
│   └── __tests__/       # Test files
├── prisma/              # Database schema and migrations
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Testing

The project uses Vitest and React Testing Library for testing. To run the tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Writing Tests

Tests are located in the `src/__tests__` directory. The project follows these testing conventions:

- Unit tests for utilities and hooks
- Integration tests for components
- E2E tests for critical user flows

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

## Deployment

### Option 1: Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel
4. Deploy

### Option 2: Manual Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:

   ```bash
   npm start
   ```

3. Configure your hosting provider (e.g., DigitalOcean, AWS EC2)

### Option 3: Deploy to AWS using SST

1. **Install SST CLI**:

   ```bash
   npm install -g sst
   ```

2. **Initialize SST in your project**:

   ```bash
   npx create-sst@latest
   ```

   Select the following options:

   - Project name: project-mgmt
   - Template: Next.js
   - Region: (your preferred AWS region)

3. **Configure SST**:
   Create a new file `sst.config.ts` in your project root:

   ```typescript
   import { SSTConfig } from "sst";
   import { NextjsSite, Stack } from "sst/constructs";

   export default {
     config(_input) {
       return {
         name: "project-mgmt",
         region: "us-east-1",
       };
     },
     stacks(app) {
       app.stack(function Site({ stack }) {
         stack.add(
           new NextjsSite(stack, "site", {
             path: ".",
             environment: {
               DATABASE_URL: process.env.DATABASE_URL!,
               NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
               NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
               GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
               GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
             },
           }),
         );
       });
     },
   } satisfies SSTConfig;
   ```

4. **Update package.json**:
   Add these scripts:

   ```json
   {
     "scripts": {
       "sst:dev": "sst dev",
       "sst:build": "sst build",
       "sst:deploy": "sst deploy",
       "sst:remove": "sst remove"
     }
   }
   ```

5. **Configure AWS Credentials**:

   ```bash
   aws configure
   ```

   Enter your AWS access key ID and secret access key.

6. **Deploy the Application**:

   ```bash
   # Start local development
   npm run sst:dev

   # Deploy to AWS
   npm run sst:deploy
   ```

7. **Set up Database**:

   - Create an RDS PostgreSQL instance in AWS
   - Update the DATABASE_URL in SST environment variables
   - Run migrations:
     ```bash
     npx prisma migrate deploy
     ```

8. **Configure Domain (Optional)**:

   ```typescript
   // In sst.config.ts
   new NextjsSite(stack, "site", {
     // ... other config
     customDomain: "your-domain.com",
   });
   ```

9. **Monitor Deployment**:

   - Check SST dashboard: `sst console`
   - Monitor AWS CloudWatch logs
   - Set up AWS X-Ray for tracing

10. **Clean Up**:
    ```bash
    npm run sst:remove
    ```

**Important Notes**:

- Ensure all environment variables are properly configured in SST
- Set up proper IAM roles and permissions
- Configure VPC settings if needed
- Set up proper security groups
- Monitor AWS costs regularly

**Troubleshooting**:

- Check SST logs: `sst console`
- Verify AWS credentials
- Check CloudWatch logs
- Ensure all environment variables are set
- Verify database connectivity

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [tRPC](https://trpc.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
