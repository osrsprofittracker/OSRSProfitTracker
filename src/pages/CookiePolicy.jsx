import React from 'react';

export default function CookiePolicy() {
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
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Cookie Policy</h1>
        <p style={{ color: 'rgb(156, 163, 175)', marginBottom: '1rem' }}>
          <strong>Last Updated:</strong> November 3, 2025
        </p>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>1. What Are Cookies?</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            Cookies are small text files stored on your device when you visit a website. They help websites 
            remember your preferences and improve your experience.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>2. How We Use Cookies</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            OSRS Profit Tracker uses browser storage (localStorage and sessionStorage) and cookies for:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li><strong>Authentication:</strong> To keep you logged in to your account</li>
            <li><strong>Preferences:</strong> To remember your theme, number format, and column visibility settings</li>
            <li><strong>Session Management:</strong> To maintain your session state</li>
            <li><strong>Performance:</strong> To cache data and improve loading times</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>3. Types of Storage We Use</h2>
          
          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            3.1 Essential Storage
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            Required for the website to function:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li><strong>Authentication Tokens:</strong> Supabase session cookies to keep you logged in</li>
            <li><strong>User Settings:</strong> Theme preferences, number format, column visibility</li>
          </ul>

          <h3 style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '0.5rem', marginTop: '1rem' }}>
            3.2 Third-Party Cookies
          </h3>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            Our third-party service providers may set cookies:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li><strong>Supabase:</strong> For authentication and session management</li>
            <li><strong>Sentry:</strong> For error tracking and performance monitoring</li>
            <li><strong>Netlify:</strong> For hosting and content delivery</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>4. Managing Cookies</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            You can control cookies through your browser settings:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li><strong>Chrome:</strong> Settings → Privacy and Security → Cookies</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies and website data</li>
            <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
          </ul>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            <strong>Note:</strong> Disabling essential cookies will prevent you from using key features of the Service, 
            including logging in and saving your data.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>5. Data Retention</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            Session cookies expire when you close your browser. Authentication tokens remain valid until you log out 
            or they expire (typically after a period of inactivity). LocalStorage data persists until you clear it 
            manually or delete your account.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>6. Updates to This Policy</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            We may update this Cookie Policy from time to time. Changes will be reflected by updating the "Last Updated" date.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>7. Contact Us</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            If you have questions about our use of cookies, contact us at:
          </p>
          <ul style={{ marginLeft: '2rem', marginTop: '1rem', color: 'rgb(203, 213, 225)', listStyle: 'none' }}>
            <li><strong>Email:</strong> osrsprofittracker@gmail.com</li>
            <li><strong>Discord:</strong> eldiab</li>
          </ul>
        </section>
      </div>
    </div>
  );
}