export default function Footer() {
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
            <a 
              href="https://gk88.vegas/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Nhà tài trợ 1
            </a>
            <a 
              href="https://example-sponsor-2.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Nhà tài trợ 2
            </a>
            <a 
              href="https://example-sponsor-3.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              Nhà tài trợ 3
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TinTức. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

