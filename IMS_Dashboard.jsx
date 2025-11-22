import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

// --- CONFIGURATION ---
// This URL must match your Python server's address for the API (ims_backend.py runs on 8081).
const API_BASE_URL = 'http://127.0.0.1:8081/api';

// Static filter options based on the backend data model
const DOC_TYPES = ['Receipt', 'Delivery', 'Internal', 'Adjustment'];
const STATUSES = ['Draft', 'Waiting', 'Ready', 'Done', 'Canceled'];
const CATEGORIES = ['Electronics', 'Peripherals', 'Components', 'Apparel', 'Home Goods']; // Expanded categories
const PIE_COLORS = ['#38bdf8', '#ef4444', '#f97316', '#10b981', '#a855f7']; // Sky, Red, Orange, Emerald, Violet

// --- Utility Components ---

const Notification = ({ message, type, onClose }) => {
    if (!message) return null;
    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-sky-500';
    
    useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [message, onClose]);

    return (
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl text-white ${bgColor} transition-opacity duration-300 z-50`}>
            {message}
        </div>
    );
};

// --- AUTHENTICATION SCREEN ---

const LoginScreen = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('stockmaster@corp.com');
    const [password, setPassword] = useState('password'); // Placeholder
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setNotification({ message: '', type: '' });

        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const result = await response.json();

            if (response.ok && result.success) {
                onLoginSuccess(result.user_id, result.role, result.profile_name);
            } else {
                setNotification({ message: result.message || 'Login failed.', type: 'error' });
            }
        } catch (error) {
            setNotification({ message: `CONNECTION ERROR: Cannot reach Python server at ${API_BASE_URL}. Ensure 'python ims_backend.py' is running.`, type: 'error' });
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-900">
            <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-xl shadow-2xl border border-sky-700/50">
                <h2 className="text-3xl font-bold text-center text-sky-400">IMS Login</h2>
                <p className="text-gray-400 text-center text-sm">Use 'stockmaster@corp.com' for Manager role.</p>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="user@example.com"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300">Password</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 mt-1 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:ring-sky-500 focus:border-sky-500"
                            placeholder="********"
                        />
                        <p className="text-xs text-right text-gray-500 mt-1">
                            <a href="#" className="hover:text-sky-400">OTP Reset Mock</a>
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 text-lg font-semibold text-white bg-sky-600 rounded-lg shadow-lg hover:bg-sky-700 transition duration-150 disabled:bg-sky-800 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Logging in...' : 'Log In'}
                    </button>
                </form>
            </div>
            <Notification {...notification} onClose={() => setNotification({ message: '', type: '' })} />
        </div>
    );
};


// --- DASHBOARD UI COMPONENTS ---

const NavItem = ({ name, icon, currentView, setView }) => (
    <button
        onClick={() => setView(name)}
        className={`flex items-center p-3 rounded-lg text-sm font-medium w-full text-left transition ${
            currentView === name
                ? 'bg-sky-700 text-white shadow-md'
                : 'text-gray-400 hover:bg-gray-700 hover:text-white'
        }`}
    >
        <span className="mr-3">{icon}</span>
        {name}
    </button>
);

const Sidebar = ({ profileName, onLogout, setView, currentNav }) => (
    <div className="bg-gray-800 p-4 space-y-6 flex flex-col h-full">
        {/* Profile */}
        <div className="space-y-2 pb-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-sky-500 rounded-full flex items-center justify-center text-white font-bold">
                    {profileName ? profileName[0] : 'U'}
                </div>
                <div>
                    <p className="text-sm font-semibold text-white">{profileName || 'User'}</p>
                    <p className="text-xs text-gray-400">My Profile</p>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="flex-grow space-y-2">
            <NavItem name="Dashboard" icon="🏠" currentView={currentNav} setView={setView} />
            <NavItem name="Products" icon="📦" currentView={currentNav} setView={setView} />
            <NavItem name="Receipts" icon="📥" currentView={currentNav} setView={setView} />
            <NavItem name="Delivery Orders" icon="🚚" currentView={currentNav} setView={setView} />
            <NavItem name="Inventory Adjustment" icon="⚙️" currentView={currentNav} setView={setView} />
            <NavItem name="Move History" icon="📜" currentView={currentNav} setView={setView} />
            <div className="border-t border-gray-700 pt-3 mt-3 space-y-2">
                <NavItem name="Settings" icon="🛠️" currentView={currentNav} setView={setView} />
            </div>
        </nav>

        {/* Logout */}
        <button 
            onClick={onLogout}
            className="w-full py-2 bg-red-600 rounded-lg text-white font-semibold hover:bg-red-700 transition"
        >
            Logout
        </button>
    </div>
);


const KPICard = ({ title, value, subValue, icon, color }) => (
    <div className="p-5 bg-gray-700 rounded-xl shadow-lg flex flex-col justify-between transition hover:shadow-sky-500/30">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className={`text-3xl font-extrabold mt-1 text-white`}>
                    {value.toLocaleString() || '...'}
                </p>
            </div>
            <span className={`p-3 rounded-full ${color.bg} text-white text-xl`}>{icon}</span>
        </div>
        {subValue && (
            <p className="text-xs text-gray-400 mt-2">
                {subValue}
            </p>
        )}
    </div>
);

// --- DASHBOARD VIEW ---

const DashboardView = ({ summary, filters, handleFilterChange, documents, loading }) => {
    
    const locations = useMemo(() => summary?.locations ? Object.keys(summary.locations) : [], [summary]);

    // Renders one filter group (Type, Status, Location, etc.)
    const renderFilterGroup = (title, options, filterName, isLocation = false) => (
        <div className="bg-gray-700 p-4 rounded-lg shadow-inner col-span-1 md:col-span-2">
            <h4 className="text-sm font-semibold text-gray-300 mb-2">{title}</h4>
            <div className="flex flex-wrap gap-2">
                {options.map(option => (
                    <button
                        key={option}
                        onClick={() => handleFilterChange(filterName, option)}
                        className={`px-3 py-1 text-xs font-medium rounded-full transition duration-150 
                            ${filters[filterName].includes(option)
                                ? 'bg-sky-600 text-white shadow-md'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                            }`}
                    >
                        {isLocation ? summary.locations[option].name : option}
                    </button>
                ))}
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Done': return '#10b981'; // Emerald
            case 'Ready': return '#fcd34d'; // Yellow
            case 'Waiting': return '#fb923c'; // Orange
            case 'Draft': return '#9ca3af'; // Gray
            case 'Canceled': return '#ef4444'; // Red
            default: return '#38bdf8'; // Sky
        }
    };
    
    // Fallback for Product count in operations table
    const getProductCount = (doc) => {
        return doc.lines.reduce((sum, line) => sum + (line.qty || 0), 0);
    };

    return (
        <div className="p-6 space-y-8 bg-gray-900/90 flex-grow">
            <h1 className="text-3xl font-bold text-gray-200 border-b border-gray-700 pb-2">Inventory Operations Snapshot</h1>
            
            {/* --- 1. KPI Cards (Row 1) --- */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard 
                    title="Total Products in Stock" 
                    value={summary?.total_products_in_stock || 0} 
                    icon="📦" 
                    color={{bg: 'bg-sky-500'}}
                />
                <KPICard 
                    title="Low Stock / Out of Stock Items" 
                    value={`${summary?.low_stock_items || 0} / ${summary?.out_of_stock_items || 0}`} 
                    subValue={`${summary?.low_stock_items || 0} items at low stock level`}
                    icon="⚠️" 
                    color={{bg: 'bg-yellow-500'}}
                />
                <KPICard 
                    title="Pending Receipts" 
                    value={summary?.pending_receipts || 0} 
                    icon="📥" 
                    color={{bg: 'bg-emerald-500'}}
                />
                <KPICard 
                    title="Pending Deliveries" 
                    value={summary?.pending_deliveries || 0} 
                    icon="🚚" 
                    color={{bg: 'bg-red-500'}}
                />
            </div>

            {/* --- 2. KPI Cards (Row 2 - Sub KPIs) --- */}
            <div className="flex flex-wrap gap-4">
                <KPICard 
                    title="Internal Transfers Scheduled" 
                    value={summary?.transfers_scheduled || 0} 
                    icon="↔️" 
                    color={{bg: 'bg-indigo-500'}}
                />
                <KPICard 
                    title="Inventory Adjustments Pending" 
                    value={summary?.adjustments_pending || 0} 
                    icon="🛠️" 
                    color={{bg: 'bg-amber-500'}}
                />
            </div>

            {/* --- 3. Dynamic Filters & Charts --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Filters Panel */}
                <div className="lg:col-span-2 p-4 bg-gray-800 rounded-xl shadow-2xl space-y-4">
                    <h2 className="text-xl font-semibold text-white">Dynamic Filters</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {renderFilterGroup("Document Type", DOC_TYPES, 'document_type')}
                        {renderFilterGroup("Status", STATUSES, 'status')}
                        {renderFilterGroup("Warehouse / Location", locations, 'location', true)}
                        {renderFilterGroup("Product Category", CATEGORIES, 'category')}
                    </div>
                </div>

                {/* Charts Panel */}
                <div className="lg:col-span-1 p-4 bg-gray-800 rounded-xl shadow-2xl space-y-4">
                    <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">Product Stock Breakdown</h2>
                    
                    {/* Stock by Location (Bar Chart) */}
                    <div className="h-40">
                        <h3 className="text-sm text-gray-400">Product Stock Availability by Location</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={summary?.location_chart_data || []} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                                <XAxis dataKey="location" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                <Bar dataKey="stock" fill="#38bdf8" radius={[5, 5, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Categories Breakdown (Pie Chart) */}
                    <div className="h-40">
                        <h3 className="text-sm text-gray-400">Product Categories Breakdown</h3>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <Pie
                                    data={summary?.category_chart_data || []}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="35%"
                                    cy="50%"
                                    outerRadius={45}
                                    fill="#8884d8"
                                    labelLine={false}
                                >
                                    {summary?.category_chart_data?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                                <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* --- 4. Recent Operations Table --- */}
            <h2 className="text-xl font-semibold text-gray-200">Recent Operations ({loading ? 'Loading...' : documents.length} shown)</h2>
            <div className="bg-gray-800 rounded-xl shadow-2xl overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Document ID</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Type</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Location</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Product Count</th>
                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-300">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading && <tr><td colSpan="6" className="p-4 text-center text-sky-400">Fetching operations...</td></tr>}
                        {!loading && documents.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">No documents match the filters.</td></tr>}
                        {!loading && documents.map(doc => (
                            <tr key={doc.id} className="hover:bg-gray-700 transition duration-150">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-sky-300">{doc.id}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{doc.type}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold" style={{color: getStatusColor(doc.status)}}>
                                    {doc.status}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                                    {doc.source_location || doc.target_location || 'N/A'}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-200">{getProductCount(doc)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                                    {new Date(doc.created_at).toLocaleDateString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}


// --- APP CONTAINER ---

export default function App() {
    const [view, setView] = useState('login'); 
    const [currentNav, setCurrentNav] = useState('Dashboard'); // Tracks active navigation link
    const [authData, setAuthData] = useState({ userId: null, role: null, profileName: null });
    const [filters, setFilters] = useState({ document_type: [], status: [], location: [], category: [] });

    // State for dashboard data
    const [summary, setSummary] = useState(null);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    
    const handleLoginSuccess = (userId, role, profileName) => {
        setAuthData({ userId, role, profileName });
        setView('dashboard');
        setCurrentNav('Dashboard');
    };

    const handleLogout = () => {
        setAuthData({ userId: null, role: null, profileName: null });
        setView('login');
    };
    
    // Combined fetch logic
    const fetchDashboardData = useCallback(async (currentFilters) => {
        // Only run fetch if authenticated
        if (!authData.userId) return;

        setLoading(true);
        try {
            // 1. Fetch Summary (Requires User-Id for auth check)
            const summaryResponse = await fetch(`${API_BASE_URL}/dashboard/summary`, {
                headers: { 'User-Id': authData.userId }
            });
            const summaryData = await summaryResponse.json();
            setSummary(summaryData);

            // 2. Fetch Documents (with filters)
            const docResponse = await fetch(`${API_BASE_URL}/documents/filter`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'User-Id': authData.userId },
                body: JSON.stringify(currentFilters)
            });
            const docData = await docResponse.json();
            setDocuments(docData.documents);
            
        } catch (error) {
            console.error("Dashboard data fetch error:", error);
            setNotification({ message: 'Failed to fetch dashboard data. Check backend connection and authentication.', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [authData.userId]);

    // Initial load and filter change trigger
    useEffect(() => {
        if (view === 'dashboard' && authData.userId) {
            fetchDashboardData(filters);
        }
    }, [view, authData.userId, filters, fetchDashboardData]);

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => {
            const currentList = prev[filterName];
            let newFilters;
            if (currentList.includes(value)) {
                newFilters = { ...prev, [filterName]: currentList.filter(item => item !== value) };
            } else {
                newFilters = { ...prev, [filterName]: [...currentList, value] };
            }
            return newFilters;
        });
    };

    if (view === 'login') {
        return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }
    
    // Fallback for non-dashboard views
    const renderContent = () => {
        switch (currentNav) {
            case 'Dashboard':
                return (
                    <DashboardView 
                        summary={summary}
                        filters={filters}
                        handleFilterChange={handleFilterChange}
                        documents={documents}
                        loading={loading}
                    />
                );
            case 'Products':
                return <div className="p-6 text-white text-xl">Products Management View (To be implemented)</div>;
            case 'Receipts':
                return <div className="p-6 text-white text-xl">Receipts/Incoming Stock View (To be implemented)</div>;
            case 'Delivery Orders':
                return <div className="p-6 text-white text-xl">Delivery Orders/Outgoing Stock View (To be implemented)</div>;
            case 'Inventory Adjustment':
                return <div className="p-6 text-white text-xl">Inventory Adjustment View (To be implemented)</div>;
            case 'Move History':
                return <div className="p-6 text-white text-xl">Move History View (To be implemented)</div>;
            case 'Settings':
                return <div className="p-6 text-white text-xl">Settings View (Warehouse config, etc.) (To be implemented)</div>;
            default:
                return <div className="p-6 text-white text-xl">Welcome! Select a module from the sidebar.</div>;
        }
    };

    // --- Main Layout ---
    return (
        <div className="flex min-h-screen bg-gray-900">
            <div className="w-64 flex-shrink-0">
                <Sidebar 
                    profileName={authData.profileName} 
                    onLogout={handleLogout} 
                    setView={setCurrentNav}
                    currentNav={currentNav}
                />
            </div>
            <div className="flex-grow">
                {renderContent()}
            </div>
            <Notification {...notification} onClose={() => setNotification({ message: '', type: '' })} />
        </div>
    );
}