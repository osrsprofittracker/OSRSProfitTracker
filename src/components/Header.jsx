import React from 'react';
import { Plus, Download, Upload, FolderPlus, LogOut } from 'lucide-react';

export default function Header({
    onExport,
    onAddCategory,
    onAddStock,
    onOpenSettings,
    onLogout,
}) {
    return (
        <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 'bold',
                    background: 'linear-gradient(to right, rgb(96, 165, 250), rgb(192, 132, 252))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    Stock Portfolio Tracker
                </h1>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <a
                        href="https://buymeacoffee.com/osrsprofittracker"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-support"
                    >
                        ☕ Support
                    </a>
                    <button
                        onClick={onAddCategory}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgb(67, 56, 202)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(55, 48, 163)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(67, 56, 202)'}
                    >
                        <FolderPlus size={18} /> Add Category
                    </button>
                    <button className="btn btn-primary" onClick={onAddStock}>
                        <Plus size={18} /> Add Stock
                    </button>
                    <button className="btn btn-secondary" onClick={onOpenSettings}>
                        ⚙️ Settings
                    </button>
                    <button className="btn btn-success" onClick={onExport}>
                        Export
                    </button>
                    {onLogout && (
                        <button
                            onClick={onLogout}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'rgb(220, 38, 38)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.875rem',
                                border: 'none',
                                color: 'white',
                                cursor: 'pointer'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'rgb(185, 28, 28)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'rgb(220, 38, 38)'}
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}