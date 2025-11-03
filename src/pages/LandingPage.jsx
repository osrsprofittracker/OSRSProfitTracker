import React from 'react';
import { TrendingUp, DollarSign, BarChart3, Shield } from 'lucide-react';

export default function LandingPage({ onGetStarted }) {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'rgb(15, 23, 42)',
            color: 'white'
        }}>
            {/* Header */}
            <header style={{
                padding: '1.5rem 2rem',
                borderBottom: '1px solid rgb(51, 65, 85)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontSize: '2rem' }}>💰</div>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700' }}>OSRS Profit Tracker</span>
                </div>
                <button
                    onClick={onGetStarted}
                    style={{
                        padding: '0.625rem 1.5rem',
                        background: 'rgb(37, 99, 235)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgb(29, 78, 216)'}
                    onMouseOut={(e) => e.target.style.background = 'rgb(37, 99, 235)'}
                >
                    Get Started
                </button>
            </header>

            {/* Hero Section */}
            <section style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    marginBottom: '1.5rem',
                    lineHeight: '1.1'
                }}>
                    Track Your OSRS Investments<br />
                    <span style={{ color: 'rgb(96, 165, 250)' }}>Maximize Your Profits</span>
                </h1>
                <p style={{
                    fontSize: '1.25rem',
                    color: 'rgb(203, 213, 225)',
                    marginBottom: '2.5rem',
                    maxWidth: '800px',
                    margin: '0 auto 2.5rem',
                    lineHeight: '1.6'
                }}>
                    Free, web-based portfolio manager for OSRS traders. Track items, monitor buy limits,
                    view profit charts, manage alts, and organize your investments - all without downloads.
                </p>
                <button
                    onClick={onGetStarted}
                    style={{
                        padding: '1rem 2.5rem',
                        background: 'rgb(34, 197, 94)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.125rem',
                        boxShadow: '0 10px 25px rgba(34, 197, 94, 0.3)'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgb(22, 163, 74)'}
                    onMouseOut={(e) => e.target.style.background = 'rgb(34, 197, 94)'}
                >
                    Start Tracking Free
                </button>
            </section>

            {/* Features Grid */}
            <section style={{
                padding: '4rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '3rem'
                }}>
                    Everything You Need to Track Your OSRS Wealth
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '4rem'
                }}>
                    {[
                        {
                            icon: '📊',
                            title: 'Item Tracking',
                            description: 'Track individual items with buy/sell prices and automatically calculate profits and ROI.'
                        },
                        {
                            icon: '⏰',
                            title: 'Buy Limit Timers',
                            description: 'Never miss a buy opportunity with automatic 4-hour GE limit timers for each item.'
                        },
                        {
                            icon: '📝',
                            title: 'Transaction History',
                            description: 'Complete log of all your trades with timestamps and profit tracking.'
                        },
                        {
                            icon: '💭',
                            title: 'Item Notes',
                            description: 'Add custom notes to each item for strategies, price targets, or reminders.'
                        },
                        {
                            icon: '🗂️',
                            title: 'Categories',
                            description: 'Organize your investments into custom categories for better portfolio management.'
                        },
                        {
                            icon: '💰',
                            title: 'Multiple Income Streams',
                            description: 'Track dump profits, referral earnings, bond purchases, and more all in one place.'
                        },
                        {
                            icon: '📈',
                            title: 'Visual Charts',
                            description: 'Beautiful profit breakdown charts to visualize your portfolio performance at a glance.'
                        },
                        {
                            icon: '👥',
                            title: 'Alt Account Timers',
                            description: 'Manage multiple accounts with dedicated timers for each alt character.'
                        },
                        {
                            icon: '🔒',
                            title: 'Cloud Sync',
                            description: 'Your data is securely stored and accessible from any device, anytime.'
                        }
                    ].map((feature, index) => (
                        <div key={index} style={{
                            padding: '1.75rem',
                            background: 'rgb(30, 41, 59)',
                            borderRadius: '1rem',
                            border: '1px solid rgb(51, 65, 85)',
                            transition: 'transform 0.2s, border-color 0.2s'
                        }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.transform = 'translateY(-4px)';
                                e.currentTarget.style.borderColor = 'rgb(96, 165, 250)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.borderColor = 'rgb(51, 65, 85)';
                            }}>
                            <div style={{
                                fontSize: '2.5rem',
                                marginBottom: '1rem'
                            }}>
                                {feature.icon}
                            </div>
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: '600',
                                marginBottom: '0.75rem'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 225)',
                                lineHeight: '1.6',
                                fontSize: '0.875rem'
                            }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works Section */}
            <section style={{
                padding: '4rem 2rem',
                maxWidth: '1400px',
                margin: '0 auto'
            }}>
                <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '1.5rem'
                }}>
                    See It In Action
                </h2>
                <p style={{
                    textAlign: 'center',
                    fontSize: '1.125rem',
                    color: 'rgb(203, 213, 225)',
                    marginBottom: '4rem',
                    maxWidth: '700px',
                    margin: '0 auto 4rem'
                }}>
                    Simple, intuitive interface designed specifically for OSRS traders and merchers
                </p>

                {/* Feature Showcase Grid */}
                <div style={{
                    display: 'grid',
                    gap: '3rem'
                }}>

                    {/* Dashboard Overview */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        border: '1px solid rgb(51, 65, 85)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '2rem' }}>📊</span>
                                Complete Portfolio Dashboard
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 225)',
                                fontSize: '1rem',
                                lineHeight: '1.6'
                            }}>
                                Get a bird's-eye view of your entire OSRS portfolio. Track total portfolio value,
                                stock investments, revenue, and profits all in one place.
                            </p>
                        </div>
                        <div style={{
                            background: 'rgb(15, 23, 42)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <img
                                src="/screenshots/dashboard.png"
                                alt="Portfolio Dashboard"
                                style={{
                                    width: '100%',
                                    borderRadius: '0.5rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Alt Account Timer - Full Width */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        border: '1px solid rgb(51, 65, 85)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '2rem' }}>⏰</span>
                                Alt Account Timer & Quick Actions
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 225)',
                                fontSize: '1rem',
                                lineHeight: '1.6'
                            }}>
                                Coordinate trades across multiple accounts with dedicated timers. Access profit breakdowns
                                and category comparisons with one click.
                            </p>
                        </div>
                        <div style={{
                            background: 'rgb(15, 23, 42)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <img
                                src="/screenshots/alt-timer.png"
                                alt="Alt Account Timer and Quick Actions"
                                style={{
                                    width: '100%',
                                    borderRadius: '0.5rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Two Column - Charts */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '2rem',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>

                        {/* Profit Breakdown */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.75rem' }}>📈</span>
                                Profit Breakdown
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 225)',
                                fontSize: '0.9rem',
                                marginBottom: '1.5rem',
                                lineHeight: '1.5'
                            }}>
                                See where your GP comes from - stocks, dumps, referrals, and bonds
                            </p>
                            <div style={{
                                background: 'rgb(15, 23, 42)',
                                borderRadius: '0.5rem',
                                padding: '1.5rem',
                                border: '1px solid rgb(51, 65, 85)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '400px'
                            }}>
                                <img
                                    src="/screenshots/profit-breakdown.png"
                                    alt="Profit Breakdown Chart"
                                    style={{
                                        maxWidth: '320px',
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Category Comparison */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <h3 style={{
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.75rem' }}>🗂️</span>
                                Category Analysis
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 225)',
                                fontSize: '0.9rem',
                                marginBottom: '1.5rem',
                                lineHeight: '1.5'
                            }}>
                                Compare performance across different item categories you create
                            </p>
                            <div style={{
                                background: 'rgb(15, 23, 42)',
                                borderRadius: '0.5rem',
                                padding: '1.5rem',
                                border: '1px solid rgb(51, 65, 85)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '400px'
                            }}>
                                <img
                                    src="/screenshots/category-comparison.png"
                                    alt="Category Comparison Chart"
                                    style={{
                                        maxWidth: '320px',
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Item Tracking */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        borderRadius: '1rem',
                        padding: '2rem',
                        border: '1px solid rgb(51, 65, 85)'
                    }}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{
                                fontSize: '1.75rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '2rem' }}>💎</span>
                                Detailed Item Tracking & Buy Limit Timers
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 225)',
                                fontSize: '1rem',
                                lineHeight: '1.6'
                            }}>
                                Track every item with precision - buy/sell prices, quantities, profit calculations,
                                4-hour GE limit timers, status indicators, and custom notes. Never miss a buy opportunity again.
                            </p>
                        </div>
                        <div style={{
                            background: 'rgb(15, 23, 42)',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <img
                                src="/screenshots/item-tracking.png"
                                alt="Item Tracking with Timers"
                                style={{
                                    width: '100%',
                                    borderRadius: '0.5rem'
                                }}
                            />
                        </div>
                    </div>

                    {/* Two Column Features */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: '2rem',
                        maxWidth: '1000px',
                        margin: '0 auto'
                    }}>

                        {/* Transaction History */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📜</span>
                                Transaction Log
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 219)',
                                fontSize: '0.875rem',
                                marginBottom: '1.5rem',
                                lineHeight: '1.5'
                            }}>
                                Complete history of all buys and sells with timestamps
                            </p>
                            <div style={{
                                background: 'rgb(15, 23, 42)',
                                borderRadius: '0.5rem',
                                padding: '1.5rem',
                                border: '1px solid rgb(51, 65, 85)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '350px'
                            }}>
                                <img
                                    src="/screenshots/transaction-history.png"
                                    alt="Transaction History"
                                    style={{
                                        maxWidth: '320px',
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Item Notes */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            borderRadius: '1rem',
                            padding: '2rem',
                            border: '1px solid rgb(51, 65, 85)'
                        }}>
                            <h3 style={{
                                fontSize: '1.25rem',
                                fontWeight: '600',
                                marginBottom: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📝</span>
                                Custom Notes
                            </h3>
                            <p style={{
                                color: 'rgb(203, 213, 219)',
                                fontSize: '0.875rem',
                                marginBottom: '1.5rem',
                                lineHeight: '1.5'
                            }}>
                                Add strategies, price targets, or reminders to each item
                            </p>
                            <div style={{
                                background: 'rgb(15, 23, 42)',
                                borderRadius: '0.5rem',
                                padding: '1.5rem',
                                border: '1px solid rgb(51, 65, 85)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                minHeight: '350px'
                            }}>
                                <img
                                    src="/screenshots/notes.png"
                                    alt="Item Notes"
                                    style={{
                                        maxWidth: '320px',
                                        width: '100%',
                                        height: 'auto',
                                        borderRadius: '0.5rem'
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Perfect For Section */}
            <section style={{
                padding: '4rem 2rem',
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                <h2 style={{
                    fontSize: '2.5rem',
                    fontWeight: '700',
                    textAlign: 'center',
                    marginBottom: '3rem'
                }}>
                    Perfect For
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem'
                }}>
                    {[
                        {
                            emoji: '💼',
                            title: 'Serious Merchers',
                            description: 'Track multiple items, manage buy limits, and optimize your flipping strategy'
                        },
                        {
                            emoji: '⚡',
                            title: 'Casual Flippers',
                            description: 'Simple tracking for occasional GE flips and profit monitoring'
                        },
                        {
                            emoji: '📊',
                            title: 'Wealth Builders',
                            description: 'Monitor your overall OSRS wealth growth and investment performance'
                        },
                        {
                            emoji: '🎯',
                            title: 'Alt Managers',
                            description: 'Coordinate investments across multiple accounts with dedicated timers'
                        }
                    ].map((type, index) => (
                        <div key={index} style={{
                            textAlign: 'center',
                            padding: '2rem',
                            background: 'rgba(37, 99, 235, 0.05)',
                            borderRadius: '1rem',
                            border: '1px solid rgba(96, 165, 250, 0.2)'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{type.emoji}</div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                {type.title}
                            </h3>
                            <p style={{ color: 'rgb(203, 213, 225)', lineHeight: '1.6' }}>
                                {type.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section style={{
                padding: '4rem 2rem',
                textAlign: 'center',
                background: 'rgba(37, 99, 235, 0.1)',
                borderTop: '1px solid rgba(96, 165, 250, 0.2)',
                borderBottom: '1px solid rgba(96, 165, 250, 0.2)'
            }}>
                <h2 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    marginBottom: '1rem'
                }}>
                    Ready to Level Up Your Merching Game?
                </h2>
                <p style={{
                    fontSize: '1.125rem',
                    color: 'rgb(203, 213, 225)',
                    marginBottom: '2rem'
                }}>
                    Join traders already using OSRS Profit Tracker to maximize their GP
                </p>
                <p style={{
                    fontSize: '1rem',
                    color: 'rgb(148, 163, 184)',
                    marginBottom: '2rem'
                }}>
                    100% Free • No Downloads • Instant Access
                </p>
                <button
                    onClick={onGetStarted}
                    style={{
                        padding: '1rem 2.5rem',
                        background: 'rgb(34, 197, 94)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '1.125rem'
                    }}
                    onMouseOver={(e) => e.target.style.background = 'rgb(22, 163, 74)'}
                    onMouseOut={(e) => e.target.style.background = 'rgb(34, 197, 94)'}
                >
                    Get Started Now
                </button>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '2rem',
                textAlign: 'center',
                borderTop: '1px solid rgb(51, 65, 85)',
                fontSize: '0.875rem',
                color: 'rgb(148, 163, 184)'
            }}>
                <div style={{ marginBottom: '1rem' }}>
                    <a href="/about" style={{ color: 'rgb(96, 165, 250)', marginRight: '1.5rem', textDecoration: 'none' }}>About</a>
                    <a href="/privacy" style={{ color: 'rgb(96, 165, 250)', marginRight: '1.5rem', textDecoration: 'none' }}>Privacy</a>
                    <a href="/terms" style={{ color: 'rgb(96, 165, 250)', marginRight: '1.5rem', textDecoration: 'none' }}>Terms</a>
                    <a href="/contact" style={{ color: 'rgb(96, 165, 250)', textDecoration: 'none' }}>Contact</a>
                </div>
                <p>© 2024 OSRS Profit Tracker. Not affiliated with Jagex or Old School RuneScape.</p>
            </footer>
        </div>
    );
}