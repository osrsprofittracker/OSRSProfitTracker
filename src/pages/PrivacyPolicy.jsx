import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(15, 23, 42)',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Privacy Policy</h1>
        <p style={{ color: 'rgb(156, 163, 175)', marginBottom: '1rem' }}>
          <strong>Last Updated:</strong> November 3, 2025
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>1. Introduction</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            OSRS Profit Tracker ("we," "our," or "us") is operated by Daan Bom, located in Den Haag, Netherlands. 
            We are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, 
            use, and protect your information when you use our web application at osrsprofittracker.netlify.app.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>2. Information We Collect</h2>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            2.1 Account Information
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            When you create an account, we collect:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Username</li>
            <li>Password (encrypted and hashed)</li>
            <li>Internally generated email address (username@stock-tracker.local)</li>
          </ul>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            2.2 Usage Data
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            We automatically collect:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Stock tracking data (item names, quantities, prices, profits)</li>
            <li>Categories and portfolio organization</li>
            <li>Transaction history</li>
            <li>User preferences and settings</li>
            <li>Notes and custom data you enter</li>
          </ul>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            2.3 Technical Data
          </h3>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Browser type and version</li>
            <li>Device information</li>
            <li>IP address</li>
            <li>Error logs and debugging information</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>3. How We Use Your Information</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            We use your information to:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Provide and maintain the profit tracking service</li>
            <li>Authenticate your account and manage user sessions</li>
            <li>Store your portfolio data and preferences</li>
            <li>Improve and optimize our application</li>
            <li>Monitor and fix technical issues</li>
            <li>Communicate with you about service updates</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>4. Third-Party Services</h2>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            4.1 Supabase
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            We use Supabase for authentication and database services. Your data is stored on Supabase servers. 
            Please review Supabase's Privacy Policy at: https://supabase.com/privacy
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            4.2 Sentry
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            We use Sentry for error tracking and monitoring. Error logs may include technical information about your session. 
            Please review Sentry's Privacy Policy at: https://sentry.io/privacy/
          </p>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            4.3 Netlify
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            Our application is hosted on Netlify. Please review Netlify's Privacy Policy at: https://www.netlify.com/privacy/
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>5. Data Storage and Security</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            We implement appropriate security measures to protect your data:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Passwords are encrypted and hashed</li>
            <li>Data is transmitted over HTTPS</li>
            <li>Database access is restricted and authenticated</li>
            <li>Regular security updates and monitoring</li>
          </ul>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            However, no method of transmission over the internet is 100% secure. While we strive to protect your data, 
            we cannot guarantee absolute security.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>6. Your Rights (GDPR)</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            As we are based in the Netherlands and serve EU users, you have the following rights under GDPR:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
            <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
            <li><strong>Right to Erasure:</strong> Request deletion of your account and data</li>
            <li><strong>Right to Data Portability:</strong> Export your data (via our export feature)</li>
            <li><strong>Right to Object:</strong> Object to processing of your data</li>
            <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
          </ul>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            To exercise these rights, contact us at: osrsprofittracker@gmail.com
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>7. Data Retention</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            We retain your data for as long as your account is active. If you delete your account, 
            we will delete your personal data within 30 days, except where we are required to retain it by law.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>8. Children's Privacy</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            Our service is not directed to children under 13 (or 16 in the EU). We do not knowingly collect 
            data from children. If you believe we have collected data from a child, please contact us immediately.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>9. Changes to This Policy</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            We may update this Privacy Policy from time to time. We will notify users of material changes 
            by updating the "Last Updated" date. Continued use of the service constitutes acceptance of the updated policy.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>10. Contact Us</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            If you have questions about this Privacy Policy, contact us at:
          </p>
          <ul style={{ marginLeft: '2rem', marginTop: '1rem', color: 'rgb(203, 213, 225)', listStyle: 'none' }}>
            <li><strong>Email:</strong> osrsprofittracker@gmail.com</li>
            <li><strong>Discord:</strong> eldiab</li>
            <li><strong>Operator:</strong> Daan Bom</li>
            <li><strong>Location:</strong> Den Haag, Netherlands</li>
          </ul>
        </section>
      </div>
    </div>
  );
}