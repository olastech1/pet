export interface PageSection {
  id: string;
  title: string;
  body: string;
}

export type PageKey = "page_privacy" | "page_terms" | "page_shipping";

export const PAGE_DEFAULTS: Record<PageKey, PageSection[]> = {
  page_privacy: [
    {
      id: "pp-1",
      title: "1. Introduction",
      body: "Welcome to EuthList (\"we\", \"us\", or \"our\"). We operate the website euthlist.com and any related services (collectively, the \"Service\"). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service. Please read it carefully.\n\nBy accessing or using our Service you agree to the collection and use of your information in accordance with this policy. If you do not agree, please do not use our Service.",
    },
    {
      id: "pp-2",
      title: "2. Information We Collect",
      body: "We collect the following categories of information:\n\n- Personal Identification Information: Name, email address, phone number, and billing/shipping address provided during checkout or account registration.\n- Payment Information: Payment card details are processed exclusively by Stripe, our PCI-DSS-compliant payment processor. EuthList never stores raw card numbers on our servers.\n- Order & Transaction Data: Records of purchases, donations, adoption inquiries, and related correspondence.\n- Usage Data: IP address, browser type, pages visited, time spent, referring URLs, and other diagnostic data collected automatically.\n- Cookies & Tracking: We use essential cookies for session management and preference storage (e.g. theme, currency). No third-party advertising cookies are set.",
    },
    {
      id: "pp-3",
      title: "3. How We Use Your Information",
      body: "We use the information we collect to:\n\n- Process and fulfil your orders and donations\n- Send order confirmations, donation receipts, and service notifications via email\n- Respond to your enquiries and provide customer support\n- Improve our website, products, and services\n- Comply with legal obligations and prevent fraud\n- Send you occasional updates about EuthList (you may opt out at any time)\n\nWe will never sell your personal data to third parties.",
    },
    {
      id: "pp-4",
      title: "4. Data Sharing & Disclosure",
      body: "We may share your information with the following trusted parties only as necessary to operate our Service:\n\n- Stripe: Our payment processor. Subject to Stripe's Privacy Policy (stripe.com/privacy).\n- Email Service Providers: Used solely to deliver transactional emails (order confirmations, receipts).\n- Hosting & Infrastructure: Cloud providers that host our application under appropriate data processing agreements.\n- Legal Authorities: Where required by applicable law, court order, or to protect the rights and safety of EuthList or others.",
    },
    {
      id: "pp-5",
      title: "5. Data Retention",
      body: "We retain your personal data for as long as necessary to fulfil the purposes described in this policy, including for legal, accounting, or reporting requirements. Order records are typically retained for 7 years in accordance with standard accounting requirements. You may request deletion of your data at any time (see Section 7).",
    },
    {
      id: "pp-6",
      title: "6. Cookies",
      body: "Our site uses strictly necessary cookies to remember your preferences (such as currency and colour theme) and to keep you logged into the admin panel. These are first-party cookies only and do not track you across other websites. You may disable cookies in your browser settings, but some features of the Service may not function correctly.",
    },
    {
      id: "pp-7",
      title: "7. Your Rights",
      body: "Depending on your location, you may have the right to:\n\n- Access: Request a copy of the personal data we hold about you\n- Rectification: Request correction of inaccurate data\n- Erasure: Request deletion of your data (\"right to be forgotten\")\n- Restriction: Request that we limit processing of your data\n- Portability: Receive your data in a structured, machine-readable format\n- Objection: Object to processing based on legitimate interests or for direct marketing\n\nTo exercise any of these rights, please contact us at privacy@euthlist.com. We will respond within 30 days.",
    },
    {
      id: "pp-8",
      title: "8. Security",
      body: "We implement industry-standard security measures including HTTPS encryption, secure server environments, and access controls to protect your information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.",
    },
    {
      id: "pp-9",
      title: "9. Children's Privacy",
      body: "Our Service is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately at privacy@euthlist.com.",
    },
    {
      id: "pp-10",
      title: "10. Changes to This Policy",
      body: "We may update this Privacy Policy from time to time. When we do, we will revise the \"Last updated\" date at the top of this page. We encourage you to review this policy periodically. Continued use of the Service after changes constitutes acceptance of the revised policy.",
    },
    {
      id: "pp-11",
      title: "11. Contact Us",
      body: "If you have any questions about this Privacy Policy, please contact our Privacy Team:\n\nEuthList — Privacy Team\neuthlist.com · London, United Kingdom\nEmail: privacy@euthlist.com",
    },
  ],

  page_terms: [
    {
      id: "tos-1",
      title: "1. Acceptance of Terms",
      body: "By accessing or using the EuthList website (euthlist.com) and any related services (collectively, the \"Service\"), you agree to be bound by these Terms of Service (\"Terms\"). If you do not agree to all of these Terms, you may not use our Service.\n\nWe reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.",
    },
    {
      id: "tos-2",
      title: "2. About EuthList",
      body: "EuthList is a global online pet sanctuary that facilitates the purchase, adoption, and rehoming of pets, as well as the sale of pet supplies. We also operate a charitable donation programme that supports animal rescue operations, veterinary care, and shelter infrastructure worldwide.",
    },
    {
      id: "tos-3",
      title: "3. Eligibility",
      body: "You must be at least 18 years old to use our Service and make purchases or donations. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into binding contracts in your jurisdiction.",
    },
    {
      id: "tos-4",
      title: "4. Purchases & Payments",
      body: "- All prices are displayed in your selected currency (USD, EUR, or GBP). Final charges are applied at current exchange rates at the time of payment.\n- All payments are processed securely by Stripe. EuthList does not store your payment card information.\n- By completing a purchase, you authorise EuthList to charge your chosen payment method for the total order amount including applicable taxes and fees.\n- All sales are subject to our return and refund policy (see Section 8).",
    },
    {
      id: "tos-5",
      title: "5. Pet Adoption & Purchase",
      body: "- Pets listed as \"Premium Pet\" are available for direct purchase. Pets listed as \"Rescue for Adoption\" are available for adoption and may be subject to a nominal adoption fee.\n- EuthList reserves the right to conduct suitability assessments for all pet adoptions. We may decline an adoption request if we determine the prospective home is not suitable.\n- You are responsible for ensuring compliance with all applicable laws and regulations in your jurisdiction regarding pet ownership, importation, and transport.\n- Health certificates, vaccination records, and microchipping will be provided for all pets at the time of transfer.\n- EuthList is not liable for any losses, costs, or damages arising from the failure to comply with local pet import regulations.",
    },
    {
      id: "tos-6",
      title: "6. Donations",
      body: "- Donations made through EuthList are voluntary and non-refundable unless required by applicable law.\n- Donation amounts go directly to partner rescue centres and shelters. EuthList charges no administration fee on donations.\n- By donating, you acknowledge that you are not purchasing goods or services and that the donation is a gift.\n- We will email you a donation receipt for your records.",
    },
    {
      id: "tos-7",
      title: "7. Product Descriptions & Availability",
      body: "We make every effort to ensure that product descriptions, images, and prices are accurate. However, EuthList does not warrant that descriptions, pricing, or other content on the Service is accurate, complete, reliable, current, or error-free. We reserve the right to correct errors, update information, or cancel orders in the event of inaccuracies, without prior notice.\n\nAll pets and products are subject to availability. We reserve the right to limit quantities or refuse any order at our sole discretion.",
    },
    {
      id: "tos-8",
      title: "8. Returns & Refunds",
      body: "- Pet purchases: Due to the nature of live animals, all pet sales are final once the pet has been transferred to you. If a pet becomes ill within 14 days of transfer due to a pre-existing condition, please contact us immediately at support@euthlist.com.\n- Pet supplies: Unused and unopened supplies may be returned within 30 days of delivery for a full refund. Items must be in original packaging. Return shipping costs are the buyer's responsibility unless the item was defective or incorrectly sent.\n- Donations: All donations are final and non-refundable.\n\nTo initiate a return, email us at support@euthlist.com with your order reference number.",
    },
    {
      id: "tos-9",
      title: "9. Intellectual Property",
      body: "All content on the Service — including but not limited to text, graphics, logos, icons, images, and software — is the property of EuthList or its content suppliers and is protected by applicable intellectual property laws. You may not reproduce, distribute, modify, or create derivative works without our express written consent.",
    },
    {
      id: "tos-10",
      title: "10. User Conduct",
      body: "You agree not to:\n\n- Use the Service for any unlawful purpose or in violation of any applicable regulations\n- Attempt to gain unauthorised access to any part of the Service or its related systems\n- Submit false, misleading, or fraudulent information\n- Use automated tools to scrape, crawl, or collect data from the Service without permission\n- Interfere with or disrupt the integrity or performance of the Service",
    },
    {
      id: "tos-11",
      title: "11. Limitation of Liability",
      body: "To the fullest extent permitted by applicable law, EuthList and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses, resulting from your use of or inability to use the Service.\n\nOur total liability for any claim arising out of or relating to these Terms or the Service shall not exceed the amount you paid to EuthList in the 12 months preceding the claim.",
    },
    {
      id: "tos-12",
      title: "12. Governing Law",
      body: "These Terms shall be governed by and construed in accordance with the laws of England and Wales, without regard to its conflict of law principles. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.",
    },
    {
      id: "tos-13",
      title: "13. Contact Us",
      body: "If you have any questions about these Terms, please contact our Legal Team:\n\nEuthList — Legal Team\neuthlist.com · London, United Kingdom\nEmail: legal@euthlist.com",
    },
  ],

  page_shipping: [
    {
      id: "sh-1",
      title: "Overview",
      body: "EuthList ships worldwide to 40+ countries. All live animal transport is handled by certified veterinary and logistics partners in full compliance with IATA Live Animals Regulations and the laws of the destination country.\n\n- 40+ Countries served\n- 3–10 days pet delivery\n- 5–14 days supplies delivery\n- All orders fully insured",
    },
    {
      id: "sh-2",
      title: "Pet Transport Process",
      body: "Every pet shipment includes:\n\n- Pre-travel Health Check: Full veterinary examination, vaccinations, microchipping, and an official health certificate at least 72 hours before travel.\n- IATA-approved Transport: Pets travel in IATA-approved, ventilated carriers with food, water, and comfort padding. A dedicated handler accompanies them throughout.\n- Live Tracking: Real-time tracking updates. Our pet care team is available 24/7 during transit via email or WhatsApp.\n- Quarantine Support: Our team coordinates all quarantine documentation and border clearance paperwork for your destination country.",
    },
    {
      id: "sh-3",
      title: "Pet Delivery Timelines",
      body: "Estimated transit times by region (start after pre-travel health check):\n\n- United Kingdom & Ireland: 2–4 business days — From $180\n- Europe (EU & EEA): 3–5 business days — From $220\n- North America (US & Canada): 4–7 business days — From $350\n- Australia & New Zealand: 7–10 business days — From $480\n- Asia-Pacific: 5–8 business days — From $400\n- Middle East: 4–6 business days — From $300\n- Rest of World: 7–14 business days — Quote on request\n\nTransit times are estimates and may vary based on destination country quarantine requirements and flight availability.",
    },
    {
      id: "sh-4",
      title: "Pet Supplies Shipping",
      body: "Pet supplies are dispatched within 1–2 business days of order confirmation. All parcels are tracked and insured.\n\nShipping options:\n\n- Standard International: 7–14 business days — $12.99 (free over $75)\n- Express International: 3–5 business days — $29.99 (free over $150)\n- Priority (US, UK, EU): 2–3 business days — $49.99 (free over $200)",
    },
    {
      id: "sh-5",
      title: "Customs & Import Duties",
      body: "Import duties, taxes, and customs fees may apply depending on your country's regulations. These charges are the responsibility of the recipient and are not included in our prices. Please check with your local customs authority before ordering.\n\n- We declare accurate item values on all customs documentation — we do not under-declare.\n- Our team handles all export documentation from the country of origin.\n- For pet imports, we provide all required health certificates, vaccination records, and import permits.\n- If a shipment is held by customs beyond 5 days, our logistics team will contact you with options.",
    },
    {
      id: "sh-6",
      title: "Order Tracking",
      body: "Once your order is dispatched, you will receive a confirmation email with your tracking number and a direct link to track your shipment in real time. You can also look up your order at any time from the My Orders page using your email address.\n\nIf you have not received a tracking email within 3 business days of your order, please check your spam folder or contact us at shipping@euthlist.com.",
    },
    {
      id: "sh-7",
      title: "Contact Shipping Support",
      body: "For all shipping enquiries:\n\nEuthList — Shipping Support\nMonday–Friday, 9am–6pm GMT\nEmail: shipping@euthlist.com\nGeneral support: support@euthlist.com",
    },
  ],
};

export function parseSections(json: string): PageSection[] {
  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed)) return parsed;
  } catch {}
  return [];
}
