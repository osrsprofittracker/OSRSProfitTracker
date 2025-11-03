import React from 'react';

export default function Terms() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'rgb(15, 23, 42)',
      color: 'white',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Back Button */}
  <a 
    href="/"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: 'rgb(96, 165, 250)',
      textDecoration: 'none',
      marginBottom: '2rem',
      fontSize: '0.875rem',
      transition: 'color 0.2s'
    }}
    onMouseOver={(e) => e.target.style.color = 'rgb(147, 197, 253)'}
    onMouseOut={(e) => e.target.style.color = 'rgb(96, 165, 250)'}
  >
    ← Back to App
  </a>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Terms of Service</h1>
        <p style={{ color: 'rgb(156, 163, 175)', marginBottom: '1rem' }}>
          <strong>Last Updated:</strong> November 3, 2025
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>1. Acceptance of Terms</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            By accessing and using OSRS Profit Tracker ("Service"), operated by Daan Bom in Den Haag, Netherlands, 
            you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>2. Description of Service</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            OSRS Profit Tracker is a web application that allows users to track their Old School RuneScape (OSRS) 
            investments, profits, and portfolio performance. The Service includes:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Stock/item tracking functionality</li>
            <li>Buy/sell transaction recording</li>
            <li>Profit calculation and visualization</li>
            <li>Portfolio organization and management</li>
            <li>Data export capabilities</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>3. User Accounts</h2>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            3.1 Account Creation
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            You must create an account to use the Service. You agree to:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Provide accurate information</li>
            <li>Maintain the security of your password</li>
            <li>Be responsible for all activity under your account</li>
            <li>Notify us immediately of any unauthorized access</li>
          </ul>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            3.2 Account Termination
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            We reserve the right to suspend or terminate accounts that violate these Terms or engage in abusive behavior.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>4. User Conduct</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            You agree NOT to:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>Use the Service for any illegal purpose</li>
            <li>Attempt to gain unauthorized access to our systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated tools to scrape or harvest data</li>
            <li>Impersonate others or create fake accounts</li>
            <li>Transmit viruses, malware, or harmful code</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>5. Intellectual Property</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            The Service, including its design, code, features, and content, is owned by Daan Bom and protected by 
            intellectual property laws. You may not copy, modify, distribute, or reverse engineer any part of the Service.
          </p>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            OSRS Profit Tracker is not affiliated with or endorsed by Jagex Ltd. Old School RuneScape is a trademark 
            of Jagex Ltd.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>6. User Data and Privacy</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            Your use of the Service is also governed by our Privacy Policy. By using the Service, you consent to 
            our collection and use of your data as described in the Privacy Policy.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>7. Disclaimer of Warranties</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>The Service will be uninterrupted or error-free</li>
            <li>Data will be accurate or reliable</li>
            <li>The Service will meet your specific requirements</li>
            <li>Any errors or bugs will be corrected</li>
          </ul>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            You use the Service at your own risk. We are not responsible for any financial decisions you make 
            based on data from the Service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>8. Limitation of Liability</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, DAAN BOM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, 
            SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR USE, 
            ARISING OUT OF YOUR USE OR INABILITY TO USE THE SERVICE.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>9. Indemnification</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            You agree to indemnify and hold harmless Daan Bom from any claims, damages, or expenses arising from 
            your use of the Service or violation of these Terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>10. Service Availability</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            We may modify, suspend, or discontinue the Service at any time without notice. We are not liable 
            for any modification, suspension, or discontinuation of the Service.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>11. Changes to Terms</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            We reserve the right to modify these Terms at any time. Material changes will be indicated by 
            updating the "Last Updated" date. Continued use of the Service after changes constitutes acceptance 
            of the modified Terms.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>12. Governing Law</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            These Terms are governed by the laws of the Netherlands. Any disputes shall be resolved in the 
            courts of Den Haag, Netherlands.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>13. Contact Information</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            For questions about these Terms, contact us at:
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