export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">📰 TinTức</h3>
            <p className="text-gray-400">
              Website tin tức hiện đại được xây dựng với Next.js và Supabase.
              Cập nhật tin tức nhanh chóng và chính xác.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Chuyên mục</h4>
            <ul className="space-y-2">
              <li>
                <a href="/category/cong-nghe" className="text-gray-400 hover:text-white transition">
                  Công nghệ
                </a>
              </li>
              <li>
                <a href="/category/the-thao" className="text-gray-400 hover:text-white transition">
                  Thể thao
                </a>
              </li>
              <li>
                <a href="/category/suc-khoe" className="text-gray-400 hover:text-white transition">
                  Sức khỏe
                </a>
              </li>
              <li>
                <a href="/category/o-to" className="text-gray-400 hover:text-white transition">
                  Ô tô
                </a>
              </li>
              <li>
                <a href="/category/giai-tri" className="text-gray-400 hover:text-white transition">
                  Giải trí
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Công nghệ</h4>
            <ul className="space-y-2 text-gray-400">
              <li>Next.js 14</li>
              <li>TypeScript</li>
              <li>Tailwind CSS</li>
              <li>Supabase</li>
              <li>Vercel</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} TinTức. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

