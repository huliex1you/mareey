import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line
} from 'recharts';
import { 
  PlusCircle, TrendingUp, TrendingDown, Activity, 
  Receipt, ShoppingCart, Trash2, Leaf, Calculator, Calendar, UserPlus, X, Edit3, Save, Baby, Skull, Eye, Info, Plus, Shield, Syringe, LayoutDashboard, BarChart3, PieChart as PieIcon, FileText, Hash, Tag, Barcode
} from 'lucide-react';

const App = () => {
  // --- إعدادات الأقسام ---
  const tabsOrder = ['dashboard', 'purchases', 'expenses', 'births', 'sales', 'reports'];
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- إدارة البيانات مع الترقيم التسلسلي ---
  const [expenses, setExpenses] = useState([]);
  const [sales, setSales] = useState([]);
  const [mortality, setMortality] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [births, setBirths] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [animalTypes, setAnimalTypes] = useState(['نعيمي', 'نجدي', 'حري', 'سواكني', 'ماعز', 'تيوس']);
  
  // عدادات الأرقام التسلسلية
  const [purSerialCounter, setPurSerialCounter] = useState(1001);
  const [birSerialCounter, setBirSerialCounter] = useState(2001);

  // --- حالات واجهة المستخدم ---
  const [isCalcOpen, setIsCalcOpen] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPreview, setCalcPreview] = useState('');
  const [showInventoryPopup, setShowInventoryPopup] = useState(false);
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [customType, setCustomType] = useState('');
  const [error, setError] = useState(null);
  
  // مراجع السحب والضغط المطول
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const pressTimer = useRef(null);

  const [formData, setFormData] = useState({
    amount: '', 
    pricePerHead: '', 
    type: 'الأعلاف',
    date: new Date().toISOString().split('T')[0],
    count: '',
    animalType: 'نعيمي',
    age: 'جذع',
    purchaseSource: 'شراء',
    vaccineName: ''
  });

  // توليد بادئة الكود حسب نوع الحيوان
  const getAnimalCodePrefix = (type) => {
    const codeMap = {
      'نعيمي': 'NCM',
      'نجدي': 'NJD',
      'حري': 'HRI',
      'سواكني': 'SWK',
      'ماعز': 'MAZ',
      'تيوس': 'TYS'
    };
    return codeMap[type] || (type ? type.substring(0, 3).toUpperCase() : 'LIV');
  };

  // حساب مدى الأرقام التسلسلية للحيوانات داخل الدفعة
  const calculateTagRange = (type, count) => {
    const numCount = Number(count) || 0;
    if (numCount <= 0) return { startTag: '', endTag: '', tagString: '' };

    // حساب إجمالي العدد المكتسب سابقاً لهذا النوع
    const existingPurCount = purchases.filter(p => p.animalType === type).reduce((a, b) => a + (Number(b.count) || 0), 0);
    const existingBirCount = births.filter(b => b.animalType === type).reduce((a, b) => a + (Number(b.count) || 0), 0);
    const totalPrevious = existingPurCount + existingBirCount;

    const prefix = getAnimalCodePrefix(type);
    const startNum = totalPrevious + 1;
    const endNum = totalPrevious + numCount;

    const startTag = `#${prefix}-${String(startNum).padStart(4, '0')}`;
    const endTag = `#${prefix}-${String(endNum).padStart(4, '0')}`;

    const tagString = numCount === 1 ? startTag : `${startTag} ➔ ${endTag}`;

    return { startTag, endTag, tagString };
  };

  // --- منطق الحساب التلقائي (العدد × سعر الرأس) ---
  useEffect(() => {
    if (formData.count && formData.pricePerHead && (activeTab === 'purchases' || activeTab === 'sales')) {
      const total = Number(formData.count) * Number(formData.pricePerHead);
      setFormData(prev => ({ ...prev, amount: total.toString() }));
    }
  }, [formData.count, formData.pricePerHead, activeTab]);

  // --- الحاسبة الذكية ---
  useEffect(() => {
    if (!calcDisplay || calcDisplay === '0' || !/[0-9]$/.test(calcDisplay)) {
      setCalcPreview(''); return;
    }
    try {
      const sanitized = calcDisplay.replace(/×/g, '*').replace(/÷/g, '/');
      const result = new Function(`return ${sanitized}`)();
      if (isFinite(result)) setCalcPreview(String(Number(result).toLocaleString('en-US')));
    } catch { setCalcPreview(''); }
  }, [calcDisplay]);

  const handleCalcBtn = (val) => {
    if (val === 'C') { setCalcDisplay('0'); setCalcPreview(''); }
    else if (val === '=') { if (calcPreview) { setCalcDisplay(calcPreview.replace(/,/g, '')); setCalcPreview(''); } }
    else setCalcDisplay(prev => (prev === '0' || prev === 'Error' ? val : prev + val));
  };

  // --- التنقل بالسحب بدون قفز الشاشة ---
  const handleTouchStart = (e) => { touchStartX.current = e.targetTouches[0].clientX; };
  const handleTouchMove = (e) => { touchEndX.current = e.targetTouches[0].clientX; };
  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const currentIndex = tabsOrder.indexOf(activeTab);
    let changed = false;
    if (distance > 100 && currentIndex < tabsOrder.length - 1) { setActiveTab(tabsOrder[currentIndex + 1]); changed = true; }
    else if (distance < -100 && currentIndex > 0) { setActiveTab(tabsOrder[currentIndex - 1]); changed = true; }
    touchStartX.current = null; touchEndX.current = null;
    if (changed) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- الحسابات الآمنة للمخزون والتقارير ---
  const inventoryStats = useMemo(() => {
    const stats = {};
    animalTypes.forEach(t => stats[t] = { count: 0, value: 0 });
    purchases.forEach(p => {
      if (p?.animalType && stats[p.animalType]) {
        stats[p.animalType].count += (Number(p.count) || 0);
        stats[p.animalType].value += (Number(p.amount) || 0);
      }
    });
    births.forEach(b => {
      if (b?.animalType && stats[b.animalType]) {
        stats[b.animalType].count += (Number(b.count) || 0);
      }
    });
    return stats;
  }, [purchases, births, animalTypes]);

  // تقرير متوسط أسعار الشراء
  const purchaseAnalysis = useMemo(() => {
    return animalTypes.map(type => {
      const typePurchases = purchases.filter(p => p.animalType === type);
      const totalCount = typePurchases.reduce((a, b) => a + (Number(b.count) || 0), 0);
      const totalAmount = typePurchases.reduce((a, b) => a + (Number(b.amount) || 0), 0);
      const avg = totalCount > 0 ? (totalAmount / totalCount).toFixed(2) : 0;
      return { type, totalCount, totalAmount, avg };
    }).filter(item => item.totalCount > 0);
  }, [purchases, animalTypes]);

  // تقرير الأعلاف
  const feedReport = useMemo(() => {
    const feedExpenses = expenses.filter(e => e.type === 'الأعلاف');
    const totalFeed = feedExpenses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const totalAllExpenses = expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0);
    const percentage = totalAllExpenses > 0 ? ((totalFeed / totalAllExpenses) * 100).toFixed(1) : 0;
    return { totalFeed, percentage, count: feedExpenses.length };
  }, [expenses]);

  const totals = useMemo(() => {
    const expSum = expenses.reduce((a, c) => a + (Number(c.amount) || 0), 0);
    const saleSum = sales.reduce((a, c) => a + (Number(c.amount) || 0), 0);
    const purSum = purchases.reduce((a, c) => a + (Number(c.amount) || 0), 0);
    const totalOut = expSum + purSum;
    const profit = saleSum - totalOut;
    const profitPct = totalOut > 0 ? ((profit / totalOut) * 100).toFixed(1) : (saleSum > 0 ? 100 : 0);
    const totalHead = Object.values(inventoryStats).reduce((a, b) => a + (b?.count || 0), 0);
    const totalMort = mortality.reduce((a, c) => a + (Number(c.count) || 0), 0);
    
    const expenseData = [
      { name: 'الأدوية', value: expenses.filter(e => e.type === 'الأدوية').reduce((a, b) => a + (Number(b.amount) || 0), 0) },
      { name: 'الأعلاف', value: expenses.filter(e => e.type === 'الأعلاف').reduce((a, b) => a + (Number(b.amount) || 0), 0) },
      { name: 'المشتريات', value: purSum },
      { name: 'أخرى', value: expenses.filter(e => e.type === 'أخرى' || e.type === 'المواصلات').reduce((a, b) => a + (Number(b.amount) || 0), 0) }
    ].filter(v => v.value > 0);

    return { expSum, saleSum, purSum, profit, profitPct, totalMort, totalHead, expenseData, totalOut };
  }, [expenses, sales, mortality, inventoryStats, purchases]);

  const resetForm = () => {
    setFormData({ amount: '', pricePerHead: '', type: 'الأعلاف', date: new Date().toISOString().split('T')[0], count: '', animalType: animalTypes[0], age: 'جذع', purchaseSource: 'شراء', vaccineName: '' });
    setShowCustomTypeInput(false); setCustomType(''); setError(null);
  };

  const handleAddPurchase = (e) => {
    e.preventDefault();
    if (!formData.amount || !formData.count) return;
    let finalType = formData.animalType;
    if (showCustomTypeInput && customType.trim()) {
      finalType = customType.trim();
      if (!animalTypes.includes(finalType)) setAnimalTypes([...animalTypes, finalType]);
    }

    const serialCode = `PUR-${purSerialCounter}`;
    const tagInfo = calculateTagRange(finalType, formData.count);

    setPurchases([{ 
      id: Date.now(), 
      serialCode, 
      tagString: tagInfo.tagString,
      animalType: finalType, 
      count: Number(formData.count), 
      pricePerHead: Number(formData.pricePerHead), 
      amount: Number(formData.amount), 
      date: formData.date, 
      source: formData.purchaseSource 
    }, ...purchases]);

    setPurSerialCounter(prev => prev + 1);
    resetForm();
  };

  const handleAddBirth = (e) => {
    e.preventDefault();
    if (!formData.count) return;
    let finalType = formData.animalType;
    if (showCustomTypeInput && customType.trim()) {
      finalType = customType.trim();
      if (!animalTypes.includes(finalType)) setAnimalTypes([...animalTypes, finalType]);
    }

    const serialCode = `BIR-${birSerialCounter}`;
    const tagInfo = calculateTagRange(finalType, formData.count);

    setBirths([{ 
      id: Date.now(), 
      serialCode,
      tagString: tagInfo.tagString,
      animalType: finalType, 
      count: Number(formData.count), 
      date: formData.date 
    }, ...births]);

    setBirSerialCounter(prev => prev + 1);
    resetForm();
  };

  const handleAddVaccine = (e) => {
    e.preventDefault();
    if (!formData.vaccineName) return;
    setVaccinations([{ id: Date.now(), name: formData.vaccineName, animalType: formData.animalType, date: formData.date }, ...vaccinations]);
    setFormData({ ...formData, vaccineName: '' });
  };

  const handleAddSale = (e) => {
    e.preventDefault();
    const count = Number(formData.count);
    const target = formData.animalType;
    if (!formData.amount || !count) return;
    if (count > (inventoryStats[target]?.count || 0)) {
      setError(`المخزون غير كافٍ من ${target}`); return;
    }
    setSales([{ id: Date.now(), amount: Number(formData.amount), headCount: count, pricePerHead: Number(formData.pricePerHead), date: formData.date, animalType: target }, ...sales]);
    // خصم
    let rem = count;
    const newP = purchases.map(p => {
      if (rem > 0 && p.animalType === target) {
        const c = Number(p.count);
        if (c <= rem) { rem -= c; return {...p, count: 0}; }
        else { const u = {...p, count: c - rem}; rem = 0; return u; }
      }
      return p;
    }).filter(p => p.count > 0);
    setPurchases(newP);
    resetForm();
  };

  const handleAddMortality = (e) => {
    e.preventDefault();
    const count = Number(formData.count);
    const target = formData.animalType;
    if (!count) return;
    if (count > (inventoryStats[target]?.count || 0)) { setError('العدد أكبر من المخزون!'); return; }
    setMortality([{ id: Date.now(), count, date: formData.date, animalType: target }, ...mortality]);
    let rem = count;
    const newP = purchases.map(p => {
        if (rem > 0 && p.animalType === target) {
            const c = Number(p.count);
            if (c <= rem) { rem -= c; return {...p, count: 0}; }
            else { const u = {...p, count: c - rem}; rem = 0; return u; }
        }
        return p;
    }).filter(p => p.count > 0);
    setPurchases(newP);
    resetForm();
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!formData.amount) return;
    setExpenses([{ id: Date.now(), type: formData.type, amount: Number(formData.amount), date: formData.date }, ...expenses]);
    resetForm();
  };

  const ListItem = ({ title, subTitle, value, type, serialCode, tagString, icon: Icon }) => (
    <div className="bg-white/80 backdrop-blur-sm p-4 rounded-[2rem] border border-stone-100 flex justify-between items-center mb-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
          type === 'purchase' ? 'bg-purple-50 text-purple-600' : 
          type === 'expense' ? 'bg-orange-50 text-orange-600' : 
          type === 'mortality' ? 'bg-rose-50 text-rose-600' : 
          type === 'birth' ? 'bg-blue-50 text-blue-600' : 
          type === 'vaccine' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
        }`}>
          {Icon ? <Icon size={22} /> : <Activity size={22} />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            {serialCode && (
              <span className="bg-stone-800 text-white text-[11px] font-mono px-2 py-0.5 rounded-full font-black">
                #{serialCode}
              </span>
            )}
            <h4 className="text-base font-black text-stone-800">{title}</h4>
          </div>
          <p className="text-xs text-stone-500 font-bold uppercase tracking-wider mt-1">{subTitle}</p>
          {tagString && (
            <p className="text-[11px] font-mono font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg inline-block mt-1.5 border border-green-100">
              🏷️ الوسم: {tagString}
            </p>
          )}
        </div>
      </div>
      <div className="text-lg font-black text-stone-700">{value}</div>
    </div>
  );

  return (
    <div 
      className="min-h-screen bg-[#fcfaf7] text-right font-sans select-none overflow-x-hidden" 
      dir="rtl"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* نافذة الجرد (الضغط المطول) */}
      {showInventoryPopup && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-stone-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-8 border border-white/20 animate-in zoom-in-95">
            <h3 className="text-2xl font-black text-stone-800 flex items-center gap-2 mb-6">
              <Activity size={28} className="text-green-600" /> جرد القطيع
            </h3>
            <div className="space-y-4">
              {Object.entries(inventoryStats).filter(([_,d])=>d.count > 0).map(([type, data]) => {
                const prefix = getAnimalCodePrefix(type);
                return (
                  <div key={type} className="bg-stone-50 p-4 rounded-3xl flex justify-between items-center border border-stone-100 shadow-inner">
                    <div>
                      <span className="font-black text-stone-700 text-lg block">{type}</span>
                      <span className="text-xs font-mono font-bold text-stone-400">رمز الوسم: #{prefix}-XXXX</span>
                    </div>
                    <div className="text-left font-black">
                      <span className="text-2xl text-green-700 ml-1">{data.count}</span>
                      <span className="text-sm text-stone-500">رأس</span>
                    </div>
                  </div>
                );
              })}
              {totals.totalHead === 0 && <p className="text-center py-4 text-stone-400 italic font-bold text-lg">لا توجد مواشي حالياً</p>}
            </div>
            <p className="text-center text-xs font-black text-stone-400 mt-6 animate-pulse uppercase tracking-widest">أفلت البطاقة للرجوع</p>
          </div>
        </div>
      )}

      {/* الحاسبة */}
      {isCalcOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-stone-900/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-xs rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 bg-stone-800 text-left min-h-[140px] flex flex-col justify-end">
              <button onClick={() => setIsCalcOpen(false)} className="absolute top-6 right-6 text-stone-500"><X size={28} /></button>
              <div className="text-2xl font-black text-white/40 ltr" dir="ltr">{calcDisplay}</div>
              <div className="text-5xl font-black text-white ltr mt-1 animate-in slide-in-from-right-2" dir="ltr">{calcPreview || '0'}</div>
            </div>
            <div className="p-6 grid grid-cols-4 gap-3 bg-white">
              {['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+'].map(btn => (
                <button key={btn} onClick={() => handleCalcBtn(btn)} className={`h-14 rounded-2xl font-black text-xl ${btn === '=' ? 'bg-green-600 text-white' : 'bg-stone-50 text-stone-800'}`}>
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* شريط التنقل السفلي */}
      <nav className="fixed bottom-0 w-full bg-white/95 backdrop-blur-xl border-t border-stone-100 px-1 py-4 flex justify-around items-center z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] overflow-x-auto no-scrollbar">
        {[
          { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
          { id: 'purchases', label: 'المخزون', icon: UserPlus },
          { id: 'expenses', label: 'العمليات', icon: Receipt },
          { id: 'births', label: 'المواليد', icon: Baby },
          { id: 'sales', label: 'المبيعات', icon: ShoppingCart },
          { id: 'reports', label: 'التقارير', icon: BarChart3 }
        ].map((item) => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); resetForm(); window.scrollTo(0,0); }} className={`flex flex-col items-center min-w-[60px] transition-all ${activeTab === item.id ? 'text-green-700 font-black scale-110' : 'text-stone-400 font-bold'}`}>
            <item.icon size={22} />
            <span className="text-[11px] mt-1.5">{item.label}</span>
          </button>
        ))}
      </nav>

      <main className="pb-32">
        <header className="sticky top-0 z-40 bg-[#fcfaf7]/90 backdrop-blur-md px-6 py-5 flex justify-between items-center border-b border-stone-100 shadow-sm">
          <div>
            <h1 className="text-3xl font-black text-stone-800 tracking-tighter">مـراعي</h1>
            <p className="text-xs text-stone-500 font-bold uppercase tracking-[0.1em] mt-0.5">
                {activeTab === 'dashboard' ? 'لوحة المتابعة' : 
                 activeTab === 'reports' ? 'التقارير والتحليلات' : 
                 activeTab === 'births' ? 'سجل المواليد والتطعيم' : 'إدارة القطيع والتسلسل'}
            </p>
          </div>
          <button onClick={() => setIsCalcOpen(true)} className="w-12 h-12 rounded-[1.2rem] bg-white border border-stone-100 flex items-center justify-center shadow-sm active:scale-95 transition-all">
            <Calculator size={24} className="text-stone-700" />
          </button>
        </header>

        <div className="px-5 py-6 max-w-5xl mx-auto space-y-8">
          
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className={`p-8 rounded-[3rem] shadow-2xl relative overflow-hidden transition-all duration-1000 ${totals.profit >= 0 ? 'bg-gradient-to-br from-emerald-600 to-green-800 shadow-green-200' : 'bg-gradient-to-br from-rose-600 to-red-800 shadow-red-200'}`}>
                <div className="relative z-10 text-white text-center md:text-right">
                  <span className="text-sm font-black opacity-80 uppercase tracking-widest">صافي الأرباح الفعلية</span>
                  <h2 className="text-6xl font-black mt-3 tracking-tighter">{totals.profit} <span className="text-2xl font-bold opacity-80">﷼</span></h2>
                  <div className="flex justify-center md:justify-start gap-3 mt-6">
                    <div className="bg-white/15 px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase">المبيعات: {totals.saleSum} ﷼</div>
                    <div className="bg-white/15 px-4 py-2.5 rounded-2xl text-xs font-black tracking-wider uppercase">التكاليف: {totals.totalOut} ﷼</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2.2rem] border border-stone-100 shadow-sm text-center">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-[1.2rem] flex items-center justify-center mx-auto mb-3"><UserPlus size={24}/></div>
                  <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">رأس المال</p>
                  <p className="text-xl font-black text-stone-800">{totals.purSum} <span className="text-sm">﷼</span></p>
                </div>
                <div 
                  onMouseDown={() => pressTimer.current = setTimeout(() => setShowInventoryPopup(true), 800)}
                  onMouseUp={() => { clearTimeout(pressTimer.current); setShowInventoryPopup(false); }}
                  onTouchStart={() => pressTimer.current = setTimeout(() => setShowInventoryPopup(true), 800)}
                  onTouchEnd={() => { clearTimeout(pressTimer.current); setShowInventoryPopup(false); }}
                  className="bg-stone-800 p-6 rounded-[2.2rem] text-white shadow-xl text-center active:scale-95 transition-all"
                >
                  <div className="w-12 h-12 bg-stone-700 text-stone-300 rounded-[1.2rem] flex items-center justify-center mx-auto mb-3"><Activity size={24}/></div>
                  <p className="text-xs font-black text-stone-400 uppercase tracking-widest mb-1">القطيع الحالي</p>
                  <p className="text-xl font-black text-white">{totals.totalHead} <span className="text-sm text-stone-400">رأس</span></p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'purchases' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-stone-100">
                <div className="flex flex-col mb-6 gap-3">
                  <h3 className="text-xl font-black text-stone-800 flex items-center gap-2 text-purple-600"><UserPlus size={24} /> تسجيل المشتريات</h3>
                  <span className="text-sm font-mono font-black bg-purple-50 text-purple-700 px-4 py-1.5 rounded-xl border border-purple-100 w-fit">
                    رقم الدفعة القادمة: #PUR-{purSerialCounter}
                  </span>
                </div>
                <form onSubmit={handleAddPurchase} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 text-base outline-none focus:ring-2 focus:ring-purple-500 transition-all" value={formData.purchaseSource} onChange={(e) => setFormData({...formData, purchaseSource: e.target.value})}>
                      <option value="شراء">شراء حلال جديد</option>
                      <option value="رصيد بداية">رصيد أول المدة</option>
                    </select>
                    <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 text-base outline-none focus:ring-2 focus:ring-purple-500 transition-all" value={formData.animalType} onChange={(e) => {
                      if (e.target.value === 'أخرى') setShowCustomTypeInput(true);
                      else { setShowCustomTypeInput(false); setFormData({...formData, animalType: e.target.value}); }
                    }}>
                      {animalTypes.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="أخرى">أخرى (إضافة نوع جديد)</option>
                    </select>
                  </div>
                  {showCustomTypeInput && <input type="text" className="w-full p-4 bg-purple-50 border-2 border-purple-200 rounded-2xl font-black text-base outline-none animate-in zoom-in-95 placeholder-purple-300" placeholder="اكتب اسم النوع الجديد هنا..." value={customType} onChange={(e) => setCustomType(e.target.value)} />}
                  
                  {formData.count && Number(formData.count) > 0 && (
                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className="text-sm font-black text-purple-800 flex items-center gap-1">
                        <Tag size={18}/> الوسم التلقائي المتوقع:
                      </span>
                      <span className="text-sm font-mono font-black text-purple-900 dir-ltr bg-white px-3 py-1 rounded-lg border border-purple-100">
                        {calculateTagRange(showCustomTypeInput && customType ? customType : formData.animalType, formData.count).tagString}
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">العدد (رؤوس)</label>
                      <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-base outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="مثال: 10" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">سعر الرأس (﷼)</label>
                      <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-base outline-none focus:ring-2 focus:ring-purple-500 transition-all" placeholder="مثال: 1200" value={formData.pricePerHead} onChange={(e) => setFormData({...formData, pricePerHead: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <label className="text-sm font-black text-emerald-700 uppercase tracking-widest block pr-1">الإجمالي النهائي (﷼)</label>
                    <input type="number" className="w-full p-4 bg-emerald-50 border border-emerald-100 text-emerald-900 rounded-2xl font-black text-lg outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="0.00" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <button className="w-full bg-purple-600 text-white py-5 mt-2 rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-all">تثبيت المخزون بالرقم التسلسلي</button>
                </form>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest px-2 mb-4">سجل المشتريات والتتبع</h3>
                {purchases.map(p => (
                  <ListItem 
                    key={p.id} 
                    serialCode={p.serialCode}
                    tagString={p.tagString}
                    title={`${p.count} رأس - ${p.animalType}`} 
                    subTitle={`${p.source} • السعر: ${p.pricePerHead || 0} ﷼`} 
                    value={`${p.amount} ﷼`} 
                    type="purchase" 
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
              <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-stone-100 border-b-4 border-b-rose-300">
                <h3 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2 text-rose-600"><Skull size={24} /> تسجيل حالة نفوق</h3>
                <form onSubmit={handleAddMortality} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">اختر النوع</label>
                    <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 text-base outline-none focus:ring-2 focus:ring-rose-500" value={formData.animalType} onChange={(e) => setFormData({...formData, animalType: e.target.value})}>
                      {animalTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">عدد الرؤوس النافقة</label>
                    <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-base outline-none focus:ring-2 focus:ring-rose-500" placeholder="مثال: 1" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} />
                  </div>
                  <button className="w-full bg-stone-800 text-white py-5 rounded-3xl font-black text-lg active:scale-95 transition-all">تأكيد خصم النفوق</button>
                </form>
              </div>
              
              <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-stone-100 shadow-sm border-b-4 border-b-orange-300">
                <h3 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2 text-orange-500"><Receipt size={24} /> تسجيل مصروف تشغيلي</h3>
                <form onSubmit={handleAddExpense} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">نوع المصروف</label>
                    <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 text-base outline-none focus:ring-2 focus:ring-orange-500" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                      <option>الأعلاف</option><option>الأدوية</option><option>المواصلات</option><option>أخرى</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">مبلغ المصروف (﷼)</label>
                    <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-base outline-none focus:ring-2 focus:ring-orange-500" placeholder="مثال: 500" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <button className="w-full bg-orange-600 text-white py-5 rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-all">حفظ المصروف المالي</button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'births' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              <div className="bg-white p-6 md:p-8 rounded-[3rem] shadow-sm border border-stone-100 border-b-4 border-b-blue-300">
                <div className="flex flex-col gap-3 mb-6">
                  <h3 className="text-xl font-black text-stone-800 flex items-center gap-2 text-blue-600"><Baby size={26}/> تسجيل مواليد جديدة</h3>
                  <span className="text-sm font-mono font-black bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl border border-blue-100 w-fit">
                    رقم السجل: #BIR-{birSerialCounter}
                  </span>
                </div>
                <form onSubmit={handleAddBirth} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">نوع المولود</label>
                    <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 text-base outline-none focus:ring-2 focus:ring-blue-500" value={formData.animalType} onChange={(e) => setFormData({...formData, animalType: e.target.value})}>
                      {animalTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  
                  {formData.count && Number(formData.count) > 0 && (
                    <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className="text-sm font-black text-blue-800 flex items-center gap-1">
                        <Tag size={18}/> أرقام وسم المواليد:
                      </span>
                      <span className="text-sm font-mono font-black text-blue-900 dir-ltr bg-white px-3 py-1 rounded-lg border border-blue-100">
                        {calculateTagRange(formData.animalType, formData.count).tagString}
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">عدد المواليد (رؤوس)</label>
                    <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-base outline-none focus:ring-2 focus:ring-blue-500" placeholder="مثال: 2" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} />
                  </div>
                  <button className="w-full bg-blue-600 text-white py-5 rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-all">تثبيت المواليد والأوسام</button>
                </form>
              </div>

              <div className="bg-white p-6 md:p-8 rounded-[3rem] border border-stone-100 border-b-4 border-b-indigo-300">
                <h3 className="text-xl font-black text-stone-800 mb-6 flex items-center gap-2 text-indigo-600"><Syringe size={26}/> سجل التطعيمات</h3>
                <form onSubmit={handleAddVaccine} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">تطعيمات مسجلة سابقاً</label>
                    <select className="w-full p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl font-bold text-indigo-900 text-base outline-none focus:ring-2 focus:ring-indigo-500" onChange={(e) => setFormData({...formData, vaccineName: e.target.value})}>
                      <option value="">-- اختر تطعيماً أو اكتب جديداً --</option>
                      {[...new Set(vaccinations.map(v => v.name))].map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-black text-stone-500 uppercase tracking-widest block pr-1">اسم تطعيم جديد</label>
                    <input type="text" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-base outline-none focus:ring-2 focus:ring-indigo-500" placeholder="اكتب اسم التطعيم هنا..." value={formData.vaccineName} onChange={(e) => setFormData({...formData, vaccineName: e.target.value})} />
                  </div>
                  <button className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black text-lg shadow-lg active:scale-95 transition-all">حفظ التطعيم</button>
                </form>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest px-2 mb-4">أرشيف المواليد</h3>
                {births.map(b => (
                  <ListItem 
                    key={b.id} 
                    serialCode={b.serialCode}
                    tagString={b.tagString}
                    title={`مولود ${b.animalType}`} 
                    subTitle={b.date} 
                    value={`${b.count} رأس`} 
                    type="birth" 
                    icon={Baby} 
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-left-4 duration-500">
              <div className="bg-white p-8 md:p-10 rounded-[3.5rem] shadow-sm border border-stone-100 text-center">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-sm"><ShoppingCart size={36}/></div>
                <h2 className="text-3xl font-black text-stone-800 mb-8 tracking-tight">إصدار فاتورة بيع</h2>
                
                {error && <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-sm font-black mb-6 flex items-center justify-center gap-2 animate-bounce border border-rose-200"><Info size={20}/> {error}</div>}
                
                <form onSubmit={handleAddSale} className="space-y-6 text-right">
                  <div className="space-y-2">
                     <label className="text-sm font-black text-stone-500 uppercase tracking-widest text-center block">نوع الماشية المباعة</label>
                     <select className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-bold text-stone-800 text-base outline-none focus:ring-2 focus:ring-emerald-500" value={formData.animalType} onChange={(e) => setFormData({...formData, animalType: e.target.value})}>
                      {animalTypes.map(t => <option key={t} value={t}>{t}</option>)}
                     </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-stone-500 uppercase tracking-widest text-center block">العدد المباع</label>
                      <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-center text-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" value={formData.count} onChange={(e) => setFormData({...formData, count: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-stone-500 uppercase tracking-widest text-center block">سعر البيع للرأس</label>
                      <input type="number" className="w-full p-4 bg-stone-50 border border-stone-100 rounded-2xl font-black text-center text-lg outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" value={formData.pricePerHead} onChange={(e) => setFormData({...formData, pricePerHead: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-3 pt-4">
                    <label className="text-sm font-black text-emerald-700 uppercase tracking-widest text-center block">إجمالي مبلغ البيعة (﷼)</label>
                    <input type="number" className="w-full p-5 bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-2xl font-black text-center text-4xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <button className="w-full bg-emerald-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl active:scale-95 transition-transform mt-4">تأكيد البيع وإضافة الأرباح</button>
                </form>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-black text-stone-500 uppercase tracking-widest px-2 mb-4">سجل المبيعات الأخيرة</h3>
                {sales.map(s => <ListItem key={s.id} title={`بيع ${s.headCount} رأس - ${s.animalType}`} subTitle={`${s.date} • سعر الرأس: ${s.pricePerHead || 0} ﷼`} value={`${s.amount} ﷼`} type="sale" icon={ShoppingCart} />)}
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
              
              {/* تقرير الأعلاف */}
              <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm border-r-4 border-r-orange-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-black text-stone-800 flex items-center gap-2">
                      <Leaf size={28} className="text-orange-500" /> تقرير الأعلاف
                    </h3>
                    <p className="text-xs text-stone-500 font-bold uppercase mt-2 tracking-wider">تحليل تكاليف التغذية</p>
                  </div>
                  <div className="bg-orange-50 px-4 py-2.5 rounded-2xl">
                    <span className="text-xl font-black text-orange-700">{feedReport.totalFeed} ﷼</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-stone-50 p-5 rounded-3xl">
                    <p className="text-xs font-black text-stone-500 mb-2">نسبة من المصاريف</p>
                    <p className="text-2xl font-black text-stone-800">{feedReport.percentage}%</p>
                  </div>
                  <div className="bg-stone-50 p-5 rounded-3xl">
                    <p className="text-xs font-black text-stone-500 mb-2">عدد الدفعات</p>
                    <p className="text-2xl font-black text-stone-800">{feedReport.count}</p>
                  </div>
                </div>
                <div className="h-5 bg-stone-100 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-500 transition-all duration-1000" style={{ width: `${feedReport.percentage}%` }}></div>
                </div>
                <p className="text-xs text-stone-400 mt-4 font-bold text-center italic">كلما زادت النسبة زاد العبء التشغيلي على المشروع</p>
              </div>

              {/* تقرير متوسط الشراء */}
              <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm border-r-4 border-r-purple-500">
                <h3 className="text-2xl font-black text-stone-800 flex items-center gap-2 mb-8">
                  <FileText size={28} className="text-purple-500" /> متوسط تكلفة الشراء
                </h3>
                <div className="space-y-4">
                  {purchaseAnalysis.map(item => (
                    <div key={item.type} className="bg-stone-50 p-6 rounded-[2rem] flex justify-between items-center border border-stone-100 transition-transform hover:scale-[1.02]">
                      <div>
                        <span className="text-xl font-black text-stone-800 block mb-1">{item.type}</span>
                        <p className="text-sm text-stone-500 font-bold">إجمالي: {item.totalCount} رأس</p>
                      </div>
                      <div className="text-left bg-white px-5 py-3 rounded-2xl shadow-sm">
                        <span className="text-2xl font-black text-purple-700 block">{item.avg} ﷼</span>
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest mt-1">للرأس الواحد</p>
                      </div>
                    </div>
                  ))}
                  {purchaseAnalysis.length === 0 && <p className="text-center py-8 text-stone-400 font-bold text-lg italic">لا توجد بيانات شراء مسجلة بعد</p>}
                </div>
              </div>

              {/* الرسم البياني الشامل */}
              <div className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-sm min-h-[400px] flex flex-col">
                <h3 className="text-2xl font-black text-stone-800 mb-8 flex items-center gap-2">
                  <BarChart3 size={28} className="text-green-600"/> ميزان القيمة المالية
                </h3>
                <div className="flex-grow w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'المشتريات', قيمة: totals.purSum },
                      { name: 'المصاريف', قيمة: totals.expSum },
                      { name: 'المبيعات', قيمة: totals.saleSum }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#78716c', fontSize: 14, fontWeight: 'bold'}} />
                      <YAxis hide />
                      <ChartTooltip cursor={{fill: '#fcfaf7'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}} />
                      <Bar dataKey="قيمة" radius={[15, 15, 0, 0]} barSize={50}>
                        <Cell fill="#a78bfa" />
                        <Cell fill="#fb923c" />
                        <Cell fill="#10b981" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;