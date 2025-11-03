import React from 'react';

export default function About() {
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
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '2rem' }}>About OSRS Profit Tracker</h1>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Our Mission</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            OSRS Profit Tracker was created to help Old School RuneScape players efficiently track their in-game 
            investments and profits. Whether you're a dedicated merchant or casual flipper, our tool provides a 
            professional, streamlined way to monitor your portfolio and maximize your profits.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Features</h2>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li><strong>Portfolio Tracking:</strong> Monitor multiple items across custom categories</li>
            <li><strong>Buy/Sell Recording:</strong> Log transactions with detailed price history</li>
            <li><strong>Profit Calculation:</strong> Automatic profit calculations with average buy/sell prices</li>
            <li><strong>Timer System:</strong> Track GE buy limits with automated 4-hour timers</li>
            <li><strong>Transaction History:</strong> Complete history of all your trading activity</li>
            <li><strong>Data Export:</strong> Export your data for backup or analysis</li>
            <li><strong>Customization:</strong> Dark/light themes, number formatting, and column visibility</li>
            <li><strong>Charts & Analytics:</strong> Visual representations of your profit trends</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Technology</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            Built with modern web technologies for a fast, reliable experience:
          </p>
          <ul style={{ marginLeft: '2rem', marginBottom: '1rem', color: 'rgb(203, 213, 225)' }}>
            <li>React + Vite for a responsive, fast interface</li>
            <li>Supabase for secure authentication and database</li>
            <li>Hosted on Netlify for reliable uptime</li>
            <li>Sentry for error monitoring and continuous improvement</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>About the Developer</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            OSRS Profit Tracker is developed and maintained by <strong>Daan Bom</strong>, a developer based in 
            Den Haag, Netherlands. As both a developer and OSRS player, I created this tool to solve a problem 
            I experienced myself: the need for a simple, effective way to track merching profits.
          </p>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            This project is continuously improved based on user feedback and my own experience. If you have 
            suggestions or encounter issues, please don't hesitate to reach out!
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Disclaimer</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            OSRS Profit Tracker is an independent project and is not affiliated with, endorsed by, or connected 
            to Jagex Ltd. Old School RuneScape and RuneScape are trademarks of Jagex Ltd. This tool is provided 
            as-is for informational and organizational purposes only.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Free and Open</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)' }}>
            OSRS Profit Tracker is completely free to use. There are no premium features, subscriptions, or 
            hidden costs. I built this tool for the community, and it will remain free.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>Contact</h2>
          <p style={{ lineHeight: '1.6', color: 'rgb(203, 213, 225)', marginBottom: '1rem' }}>
            Have questions, suggestions, or feedback? I'd love to hear from you:
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