import React from 'react';

export default function Contact() {
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
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>Contact Us</h1>

        <section style={{ marginBottom: '2rem' }}>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '2rem' }}>
            Have questions, feedback, or need support? We're here to help! Feel free to reach out through any 
            of the following channels:
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Email</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            For general inquiries, bug reports, feature requests, or support:
          </p>
          <a 
            href="mailto:osrsprofittracker@gmail.com"
            style={{ 
              color: 'rgb(96, 165, 250)',
              textDecoration: 'none',
              fontSize: '1.125rem'
            }}
          >
            osrsprofittracker@gmail.com
          </a>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Discord</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            Prefer Discord? You can reach me directly:
          </p>
          <p style={{ 
            color: 'rgb(96, 165, 250)',
            fontSize: '1.125rem'
          }}>
            <strong>Discord:</strong> eldiab
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Response Time</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            I typically respond within 24-48 hours. Please note that OSRS Profit Tracker is maintained by a 
            single developer, so response times may vary during busy periods.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Bug Reports</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            When reporting bugs, please include:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>A description of the issue</li>
            <li>Steps to reproduce the problem</li>
            <li>Your browser and device information</li>
            <li>Screenshots if applicable</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Feature Requests</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            I'm always looking to improve OSRS Profit Tracker! If you have ideas for new features or improvements, 
            please send them my way. While I can't implement every suggestion, I carefully consider all feedback.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Business Information</h2>
          <ul style={{ marginLeft: '2rem', marginTop: '1rem', color: 'rgb(203, 213, 225)', listStyle: 'none' }}>
            <li><strong>Service:</strong> OSRS Profit Tracker</li>
            <li><strong>Operator:</strong> Daan Bom</li>
            <li><strong>Location:</strong> Den Haag, Netherlands</li>
            <li><strong>Email:</strong> osrsprofittracker@gmail.com</li>
            <li><strong>Discord:</strong> eldiab</li>
          </ul>
        </section>
      </div>
    </div>
  );
}