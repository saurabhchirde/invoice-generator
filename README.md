# Invoice Generator

A full-featured invoice generator built with React, Vite, Tailwind CSS v4, and shadcn/ui. Create, edit, preview, print, and manage invoices — all stored locally in the browser with no backend required.

## Features

### Invoice Management
- Create, edit, clone, and delete invoices
- Live preview with multi-page support
- Print / PDF-ready A4 layout with intelligent page breaking
- Filter invoices by status — All, Paid, Due, Overdue

### Line Items & Calculations
- Unlimited line items with auto-calculated subtotals
- Percentage-based discount
- GST support (SGST & CGST)
- Payment tracking with paid amount, due amount, and progress bar

### Customization
- Toggle visibility of individual sections (company info, client info, dates, taxes, terms, bank details, signatory, website)
- Custom terms & conditions
- Authorized signatory on invoice footer
- Company logo and payment QR code upload

### Business & Payment Details
- Company info (name, email, phone, address, website)
- Bank details (bank name, account number, IFSC/SWIFT code)
- Payment instructions and QR code for UPI payments

### Currency Support
- USD ($) and INR (₹)

### Dashboard
- Invoice count and amount summaries by status (Paid, Due, Overdue)
- Quick actions — preview, edit, clone, delete, call client

### Settings
- Persistent business info, payment details, and terms
- Settings auto-apply to new invoices
- All data stored in browser localStorage

## Tech Stack

- [React 18](https://react.dev)
- [Vite 6](https://vite.dev)
- [Tailwind CSS v4](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives)
- [TypeScript](https://www.typescriptlang.org)
- [React Router v7](https://reactrouter.com)

## Getting Started

```bash
npm install
npm run dev
```

App runs at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server at localhost:3000 |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

## License

This project is licensed under the [MIT License](LICENSE).
