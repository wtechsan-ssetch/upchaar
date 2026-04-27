import { useAuth } from '@/auth/AuthContext.jsx';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Activity, Clock, DollarSign, Users, LogOut, CheckCircle, XCircle, 
    Search, Edit, LayoutDashboard, TestTubes, FileText, Settings, 
    ChevronLeft, ChevronRight, Menu, Plus, X, Filter, Trash2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function DiagnosticDashboard() {
    const { profile, signOut } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [activeTab, setActiveTab] = useState('Dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isAddTestModalOpen, setIsAddTestModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [testToDelete, setTestToDelete] = useState(null);
    const [newTest, setNewTest] = useState({
        name: '',
        price: '',
        category: 'Blood Test',
        description: '',
        status: 'Active'
    });

    const handleSignOut = async () => {
        if (!window.confirm('Are you sure you want to sign out?')) return;
        await signOut();
        navigate('/');
    };

    const stats = [
        { title: "Today's Tests", value: "0", icon: Clock, color: "text-blue-600", bg: "bg-blue-100" },
        { title: "Today's Revenue", value: "₹0", icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-100" },
        { title: "Lifetime Tests", value: "0", icon: Activity, color: "text-purple-600", bg: "bg-purple-100" },
        { title: "Lifetime Revenue", value: "₹0", icon: DollarSign, color: "text-orange-600", bg: "bg-orange-100" }
    ];

    const [tests, setTests] = useState([
        { id: 1, name: 'Complete Blood Count (CBC)', price: '₹500', category: 'Blood Test', status: 'Active' },
        { id: 2, name: 'Lipid Profile', price: '₹800', category: 'Blood Test', status: 'Active' },
        { id: 3, name: 'Chest X-Ray', price: '₹600', category: 'Radiology', status: 'Active' },
        { id: 4, name: 'MRI Brain', price: '₹5000', category: 'Radiology', status: 'Inactive' },
        { id: 5, name: 'Thyroid Profile', price: '₹700', category: 'Pathology', status: 'Active' },
        { id: 6, name: 'Ultrasound Abdomen', price: '₹1200', category: 'Imaging', status: 'Active' }
    ]);

    const filteredTests = tests.filter(test => {
        const matchesSearch = test.name.toLowerCase().includes(searchTerm.toLowerCase()) || test.category.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || test.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    const handleToggleStatus = (id) => {
        setTests(tests.map(test => {
            if (test.id === id) {
                return { ...test, status: test.status === 'Active' ? 'Inactive' : 'Active' };
            }
            return test;
        }));
    };

    const handleDeleteTest = () => {
        if (testToDelete) {
            setTests(tests.filter(t => t.id !== testToDelete.id));
            setTestToDelete(null);
        }
    };

    const handleSaveNewTest = () => {
        if (!newTest.name || !newTest.price) {
            alert('Please provide at least a Test Name and Price.');
            return;
        }
        
        const newId = tests.length > 0 ? Math.max(...tests.map(t => t.id)) + 1 : 1;
        setTests([...tests, { 
            id: newId, 
            name: newTest.name, 
            price: `₹${newTest.price}`, 
            category: newTest.category, 
            status: newTest.status 
        }]);
        
        setNewTest({ name: '', price: '', category: 'Blood Test', description: '', status: 'Active' });
        setIsAddTestModalOpen(false);
    };

    const navItems = [
        { name: 'Dashboard', icon: LayoutDashboard },
        { name: 'Available Tests', icon: TestTubes },
        { name: 'Patients', icon: Users },
        { name: 'Reports', icon: FileText },
        { name: 'Settings', icon: Settings }
    ];

    return (
        <div className="h-screen bg-slate-50 flex overflow-hidden">
            {/* Sidebar */}
            <motion.div 
                animate={{ width: isSidebarOpen ? 260 : 80 }}
                className="bg-white border-r border-slate-200 h-full flex flex-col shadow-sm relative z-20 flex-shrink-0 transition-all duration-300"
            >
                {/* Sidebar Header */}
                <div className="h-20 flex items-center px-4 border-b border-slate-200">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 min-w-[40px] bg-teal-100 text-teal-600 rounded-xl flex items-center justify-center">
                            <Activity size={24} />
                        </div>
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap"
                                >
                                    <h1 className="text-lg font-bold text-slate-800">Upchaar Health</h1>
                                    <p className="text-xs text-slate-500">Diagnostic Centre</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar Toggle Button */}
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-24 w-6 h-6 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-500 hover:text-teal-600 hover:border-teal-200 shadow-sm z-30 transition-colors"
                >
                    {isSidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Sidebar Links */}
                <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.name;
                        return (
                            <button
                                key={item.name}
                                onClick={() => setActiveTab(item.name)}
                                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                                    isActive 
                                    ? 'bg-teal-50 text-teal-700 font-medium' 
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                                title={!isSidebarOpen ? item.name : ''}
                            >
                                <item.icon 
                                    size={20} 
                                    className={`min-w-[20px] transition-colors ${isActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'}`} 
                                />
                                <AnimatePresence>
                                    {isSidebarOpen && (
                                        <motion.span
                                            initial={{ opacity: 0, width: 0 }}
                                            animate={{ opacity: 1, width: 'auto' }}
                                            exit={{ opacity: 0, width: 0 }}
                                            className="whitespace-nowrap"
                                        >
                                            {item.name}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                {isActive && isSidebarOpen && (
                                    <motion.div 
                                        layoutId="sidebar-active-indicator"
                                        className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-600"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleSignOut}
                        className={`flex items-center gap-3 px-3 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors w-full ${!isSidebarOpen && 'justify-center'}`}
                        title={!isSidebarOpen ? 'Sign Out' : ''}
                    >
                        <LogOut size={20} className="min-w-[20px]" />
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: 'auto' }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="whitespace-nowrap font-medium"
                                >
                                    Sign Out
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Topbar */}
                <div className="bg-white border-b border-slate-200 h-20 px-8 flex items-center justify-between shadow-sm flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">{activeTab}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden sm:block text-right">
                            <p className="text-sm font-medium text-slate-800">{profile?.full_name || 'Diagnostic Admin'}</p>
                            <p className="text-xs text-slate-500">Center Manager</p>
                        </div>
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                            <Users size={20} className="text-slate-500" />
                        </div>
                    </div>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 w-full">
                    <div className="max-w-7xl mx-auto w-full">
                        
                        {activeTab === 'Dashboard' && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-slate-800">Overview</h3>
                                    <p className="text-slate-500">Your diagnostic center activity at a glance.</p>
                                </div>

                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                                    {stats.map((stat, idx) => (
                                        <div
                                            key={idx}
                                            className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                                    <stat.icon size={24} />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</h3>
                                                <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {(activeTab === 'Dashboard' || activeTab === 'Available Tests') && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-800">Available Tests</h2>
                                        <p className="text-sm text-slate-500">Manage and view your diagnostic test catalogue</p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative">
                                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <select 
                                                value={filterCategory}
                                                onChange={(e) => setFilterCategory(e.target.value)}
                                                className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-white appearance-none cursor-pointer"
                                            >
                                                <option value="All">All Categories</option>
                                                <option value="Blood Test">Blood Test</option>
                                                <option value="Radiology">Radiology</option>
                                                <option value="Pathology">Pathology</option>
                                                <option value="Imaging">Imaging</option>
                                                <option value="Cardiology">Cardiology</option>
                                            </select>
                                        </div>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                            <input 
                                                type="text"
                                                placeholder="Search tests..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent w-full sm:w-64"
                                            />
                                        </div>
                                        <button 
                                            onClick={() => setIsAddTestModalOpen(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm whitespace-nowrap ml-auto"
                                        >
                                            <Plus size={18} />
                                            Add Test
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                                                <th className="px-6 py-4 font-medium">Test Name</th>
                                                <th className="px-6 py-4 font-medium">Category</th>
                                                <th className="px-6 py-4 font-medium">Price</th>
                                                <th className="px-6 py-4 font-medium">Status</th>
                                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {tests.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-16 text-center">
                                                        <div className="flex flex-col items-center justify-center">
                                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                                <TestTubes size={32} className="text-slate-400" />
                                                            </div>
                                                            <h3 className="text-lg font-bold text-slate-700 mb-1">No tests available yet</h3>
                                                            <p className="text-slate-500 mb-4 max-w-sm">You haven't added any diagnostic tests to your catalogue. Click 'Add Test' to get started.</p>
                                                            <button 
                                                                onClick={() => setIsAddTestModalOpen(true)}
                                                                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
                                                            >
                                                                <Plus size={18} />
                                                                Add Test
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredTests.length > 0 ? (
                                                filteredTests.map((test) => (
                                                    <tr key={test.id} className="hover:bg-slate-50 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <p className="font-semibold text-slate-800">{test.name}</p>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                                                                {test.category}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-medium text-slate-700">
                                                            {test.price}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                                                                test.status === 'Active' 
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                                            }`}>
                                                                {test.status === 'Active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                                                {test.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <div className="flex items-center gap-2 mr-2 border-r border-slate-200 pr-4">
                                                                    <span className={`text-xs font-medium ${test.status === 'Active' ? 'text-teal-600' : 'text-slate-400'}`}>
                                                                        {test.status === 'Active' ? 'On' : 'Off'}
                                                                    </span>
                                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="sr-only peer" 
                                                                            checked={test.status === 'Active'} 
                                                                            onChange={() => handleToggleStatus(test.id)}
                                                                        />
                                                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-500"></div>
                                                                    </label>
                                                                </div>
                                                                <button 
                                                                    onClick={() => setEditingTest(test)}
                                                                    className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                                                    title="Edit Test"
                                                                >
                                                                    <Edit size={18} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => setTestToDelete(test)}
                                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Delete Test"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                                        No tests found matching your search or filter.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        )}

                        {['Patients', 'Reports', 'Settings'].includes(activeTab) && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center p-16 text-center mt-10"
                            >
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    {activeTab === 'Patients' && <Users size={40} className="text-slate-400" />}
                                    {activeTab === 'Reports' && <FileText size={40} className="text-slate-400" />}
                                    {activeTab === 'Settings' && <Settings size={40} className="text-slate-400" />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 mb-2">{activeTab} Module</h3>
                                <p className="text-slate-500 max-w-sm">This section is currently under development. Check back later for updates.</p>
                            </motion.div>
                        )}
                        
                    </div>
                </div>
            </div>

            {/* Add Test Modal */}
            <AnimatePresence>
                {isAddTestModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAddTestModalOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-800">Add New Test</h3>
                                <button 
                                    onClick={() => setIsAddTestModalOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                <form className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                                        <input 
                                            type="text" 
                                            value={newTest.name}
                                            onChange={(e) => setNewTest({...newTest, name: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
                                            placeholder="e.g. Complete Blood Count" 
                                        />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹)</label>
                                            <input 
                                                type="number" 
                                                value={newTest.price}
                                                onChange={(e) => setNewTest({...newTest, price: e.target.value})}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" 
                                                placeholder="500" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <select 
                                                value={newTest.category}
                                                onChange={(e) => setNewTest({...newTest, category: e.target.value})}
                                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-white"
                                            >
                                                <option>Blood Test</option>
                                                <option>Radiology</option>
                                                <option>Pathology</option>
                                                <option>Imaging</option>
                                                <option>Cardiology</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                        <textarea 
                                            rows="3" 
                                            value={newTest.description}
                                            onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none" 
                                            placeholder="Brief description about the test..."
                                        ></textarea>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Status</p>
                                            <p className="text-xs text-slate-500">Determine if this test is currently available</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={newTest.status === 'Active'}
                                                onChange={(e) => setNewTest({...newTest, status: e.target.checked ? 'Active' : 'Inactive'})}
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>
                                </form>
                            </div>
                            
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button 
                                    onClick={() => setIsAddTestModalOpen(false)}
                                    type="button"
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={handleSaveNewTest}
                                    className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Save Test
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Edit Test Modal */}
            <AnimatePresence>
                {editingTest && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setEditingTest(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-100">
                                <h3 className="text-xl font-bold text-slate-800">Edit Test</h3>
                                <button 
                                    onClick={() => setEditingTest(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1">
                                <form className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                                        <input type="text" defaultValue={editingTest.name} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" />
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Price</label>
                                            <input type="text" defaultValue={editingTest.price} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                            <select defaultValue={editingTest.category} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all bg-white">
                                                <option>Blood Test</option>
                                                <option>Radiology</option>
                                                <option>Pathology</option>
                                                <option>Imaging</option>
                                                <option>Cardiology</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                        <div>
                                            <p className="font-medium text-slate-800">Status</p>
                                            <p className="text-xs text-slate-500">Determine if this test is currently available</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                defaultChecked={editingTest.status === 'Active'} 
                                            />
                                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                        </label>
                                    </div>
                                </form>
                            </div>
                            
                            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
                                <button 
                                    onClick={() => setEditingTest(null)}
                                    type="button"
                                    className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button type="button" className="px-5 py-2.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm">
                                    Save Changes
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {testToDelete && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setTestToDelete(null)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden"
                        >
                            <div className="p-6 text-center">
                                <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Delete Test</h3>
                                <p className="text-slate-500 mb-6">Are you sure you want to delete <span className="font-semibold text-slate-700">{testToDelete.name}</span>? This action cannot be undone.</p>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setTestToDelete(null)}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 bg-slate-50 rounded-lg transition-colors border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleDeleteTest}
                                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
