import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      marginTop: '4rem',
      padding: '2rem 0',
      borderTop: '1px solid rgb(51, 65, 85)',
      color: 'rgb(148, 163, 184)'
    }}>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 2rem' }}>
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* About Section */}
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', color: 'white' }}>
              OSRS Profit Tracker
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
              Track your Old School RuneScape investments and maximize your profits.
            </p>
          </div>

          {/* Links Section */}
          <div style={{ flex: '1 1 150px' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', color: 'white' }}>
              Legal
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/privacy" style={{ color: 'rgb(148, 163, 184)', textDecoration: 'none' }}>
                  Privacy Policy
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/terms" style={{ color: 'rgb(148, 163, 184)', textDecoration: 'none' }}>
                  Terms of Service
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/cookies" style={{ color: 'rgb(148, 163, 184)', textDecoration: 'none' }}>
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>

          {/* About Links Section */}
          <div style={{ flex: '1 1 150px' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', color: 'white' }}>
              Company
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/about" style={{ color: 'rgb(148, 163, 184)', textDecoration: 'none' }}>
                  About Us
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                <a href="/contact" style={{ color: 'rgb(148, 163, 184)', textDecoration: 'none' }}>
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div style={{ flex: '1 1 200px' }}>
            <h3 style={{ fontWeight: '600', marginBottom: '1rem', color: 'white' }}>
              Contact
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                <a 
                  href="mailto:osrsprofittracker@gmail.com" 
                  style={{ color: 'rgb(148, 163, 184)', textDecoration: 'none' }}
                >
                  osrsprofittracker@gmail.com
                </a>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Discord: eldiab
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{
          paddingTop: '2rem',
          borderTop: '1px solid rgb(51, 65, 85)',
          fontSize: '0.875rem',
          textAlign: 'center'
        }}>
          <p style={{ marginBottom: '0.5rem' }}>
            © 2025 OSRS Profit Tracker. Operated by Daan Bom, Den Haag, Netherlands.
          </p>
          <p style={{ fontSize: '0.75rem', color: 'rgb(100, 116, 139)' }}>
            Not affiliated with or endorsed by Jagex Ltd. Old School RuneScape is a trademark of Jagex Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}