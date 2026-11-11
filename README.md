# Curbwire PLG Engine Proof-of-Concept

A standalone Proof-of-Concept (POC) demonstrating Product-Led Growth (PLG) mechanics for **Curbwire**, an ambient civic intelligence platform.

## 🎯 Overview & Acquisition Loops

This POC demonstrates how unbundling monolithic bi-weekly zip-code newsletters into discrete, interactive, and shareable micro-cards unlocks two self-sustaining acquisition loops:

1. **Loop 1 (Intra-Community Density):** Single-issue **Decision Cards** (Civic Coordination) with calendar hooks, SMS/WhatsApp sharing, and outcome tracking (*"Notify me when the council votes"*).
2. **Loop 2 (Inter-Community Expansion):** Cross-boundary organic sharing via **Bureaucratic Whimsy** (Absurd Historic Ordinances & Quirky Bylaws) paired with dynamic OpenGraph previews and geo-adaptive landing pages.

## 📋 Technical Requirements Document

See [`curbwire_plg_poc_technical_requirements_document.md`](./curbwire_plg_poc_technical_requirements_document.md) for full architecture and design specs.

## 🛠️ Stack

- **Framework:** Next.js 14+ (App Router, TypeScript)
- **Styling:** Tailwind CSS (Curbwire editorial design tokens)
- **Icons:** Lucide React
- **Dynamic Previews:** `@vercel/og` Edge Runtime ImageResponse
- **Deployment:** Netlify
