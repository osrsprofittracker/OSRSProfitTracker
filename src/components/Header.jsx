import React from 'react';
import { Plus, Download, Upload, FolderPlus, LogOut } from 'lucide-react';

export default function Header({
    onExport,
    onImportClick,
    onAddCategory,
    onAddStock,
    onOpenSettings,
    onLogout
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
                    <button
                        onClick={onExport}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgb(21, 128, 61)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(22, 101, 52)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(21, 128, 61)'}
                    >
                        <Download size={18} /> Export
                    </button>
                    <button
                        onClick={onImportClick}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgb(126, 34, 206)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(107, 33, 168)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(126, 34, 206)'}
                    >
                        <Upload size={18} /> Import
                    </button>
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
                    <button
                        onClick={onAddStock}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgb(29, 78, 216)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(30, 64, 175)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(29, 78, 216)'}
                    >
                        <Plus size={18} /> Add Stock
                    </button>
                    <button
                        onClick={onOpenSettings}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'rgb(71, 85, 105)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            border: 'none',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgb(51, 65, 85)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgb(71, 85, 105)'}
                    >
                        ⚙️ Settings
                    </button>
                </div>
            </div>
        </div>
    );
}