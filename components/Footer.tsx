'use client';

export default function Footer() {
  const year = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Nhà tài trợ */}
        <div className="text-center">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-6">
            Nhà tài trợ
          </h4>
          <div className="flex flex-wrap justify-center items-center gap-8">
            {/* Thêm link nhà tài trợ ở đây */}
            <a href="https://gk88.vegas/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">GK88</a>
            <a href="https://vipwin358.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">Vipwin</a>
            <a href="https://hb88co.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">HB88</a>
            <a href="https://23win.travel/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">23Win</a>
            <a href="https://uk88online.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">UK88</a> 
            <a href="https://hi888vip.com/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">Hi888</a>
            <a href="https://789f.rocks/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors duration-200">789F</a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            © {year} Ctrl Z. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  );
}

